/**
 * scripts/crawl-multi-source.cjs
 *
 * Crawl → rank → ALWAYS take top 10 fresh from last 24h → summarize (Gemini) → image → write
 * Then: de-dup by URL in DB and prune to newest 10.
 *
 * Designed to replace the oldest with the newest every run.
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

// ------------------ Config ------------------
const GN = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:1d")}&hl=en-US&gl=US&ceid=US:en`;

const FEEDS = [
  GN("(medical AI) OR (health AI)"),
  GN("(clinical AI) OR (biomedical AI)"),
  GN("radiology AI OR imaging AI"),
  GN("oncology AI OR cancer AI"),
  GN("FDA AI medical device OR \"machine learning\" device"),
  "https://www.nature.com/subjects/medical-ai/rss",
  "https://www.nature.com/subjects/health-informatics/rss",
  "https://www.medrxiv.org/rss.xml",
  "https://www.fiercebiotech.com/rss/xml",
  "https://www.fiercepharma.com/rss/xml",
  "https://www.statnews.com/feed/"
];

const MAX_ITEMS_PER_FEED = 25;
const MAX_CANDIDATES = 120;
const TAKE_TOP = 10;
const ORDER_CANDIDATES = ["published_at", "created_at", "inserted_at", "date", "id"];

const GEMINI_MODEL = "gemini-pro";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const PEXELS_KEY = process.env.PEXELS_API_KEY || "";

// ------------------ Helpers ------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decodeHtmlEntities = (s = "") => {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
};
const stripHtml = (s = "") => {
  const decoded = decodeHtmlEntities(s);
  return decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.host = u.host.toLowerCase();
    const STRIP_PREFIXES = ["utm_", "fbclid", "gclid", "mc_cid", "mc_eid", "igshid"];
    const keep = [];
    for (const [k, v] of u.searchParams.entries()) {
      const lower = k.toLowerCase();
      const isTracking =
        STRIP_PREFIXES.some((p) => lower.startsWith(p)) || lower === "fbclid" || lower === "gclid";
      if (!isTracking) keep.push([k, v]);
    }
    keep.sort(([a], [b]) => a.localeCompare(b));
    u.search = "";
    for (const [k, v] of keep) u.searchParams.append(k, v);
    if (u.pathname === "/") u.pathname = "";
    return u.toString();
  } catch {
    return raw;
  }
}

const isGoogleNewsLink = (u) => /^https?:\/\/news\.google\.com\/rss\//i.test(u || "");
const hostnameOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

function textBetween(xml, tag) {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const out = [];
  let i = 0;
  while (true) {
    const s = xml.indexOf(open, i);
    if (s === -1) break;
    const s2 = xml.indexOf(">", s);
    if (s2 === -1) break;
    const e = xml.indexOf(close, s2 + 1);
    if (e === -1) break;
    out.push(xml.substring(s2 + 1, e));
    i = e + close.length;
  }
  return out;
}
const firstTag = (c, t) => (textBetween(c, t)[0] || "").trim();
const tryAttrLink = (c) => (c.match(/<link[^>]*\bhref="([^"]+)"/i) || [])[1] || "";

// ------------------ Fetch feeds ------------------
async function fetchRss(url) {
  const res = await fetch(url, { headers: { "user-agent": "MedNewsAI/1.0" } });
  if (!res.ok) throw new Error(`RSS fetch failed ${res.status} for ${url}`);
  const xml = await res.text();

  const chunks = textBetween(xml, "item").concat(textBetween(xml, "entry"));
  const items = chunks
    .map((chunk) => {
      const title = stripHtml((firstTag(chunk, "title") || "").replace(/<!\[CDATA\[|\]\]>/g, ""));
      const desc = stripHtml(
        (firstTag(chunk, "description") || firstTag(chunk, "content") || "").replace(/<!\[CDATA\[|\]\]>/g, "")
      );
      let link = stripHtml((firstTag(chunk, "link") || tryAttrLink(chunk) || "").replace(/<!\[CDATA\[|\]\]>/g, ""));
      const src = stripHtml((firstTag(chunk, "source") || firstTag(chunk, "author") || "").replace(/<!\[CDATA\[|\]\]>/g, ""));
      const date = stripHtml((firstTag(chunk, "pubDate") || firstTag(chunk, "updated") || firstTag(chunk, "published") || "").replace(/<!\[CDATA\[|\]\]>/g, ""));
      if (!/^https?:\/\//i.test(link)) link = "";
      return { title, url: link, source: src, pubDate: date, description: desc };
    })
    .filter((it) => it.url);

  return items.slice(0, MAX_ITEMS_PER_FEED);
}

async function unwrapGoogleNews(url) {
  try {
    if (!isGoogleNewsLink(url)) return url;
    const r = await fetch(url, { redirect: "follow", method: "HEAD" });
    if (r.ok) return normalizeUrl(r.url || url);
  } catch {}
  return normalizeUrl(url);
}

async function gatherCandidates() {
  const out = [];
  for (const f of FEEDS) {
    try {
      const items = await fetchRss(f);
      out.push(...items);
    } catch (e) {
      console.error("Feed error:", f, e.message || e);
    }
    if (out.length >= MAX_CANDIDATES) break;
    await sleep(150);
  }
  return out.slice(0, MAX_CANDIDATES);
}

// ------------------ Relevance & ranking ------------------
function parseDate(d) { const t = Date.parse(d); return Number.isFinite(t) ? t : 0; }

function relevanceScore({ title, description, url, pubDate }) {
  const t = `${title} ${description}`.toLowerCase();
  let score = 0;
  if (/\b(ai|artificial intelligence|machine learning|deep learning|llm|transformer)s?\b/i.test(t)) score += 5;
  if (/\b(medical|health|clinical|hospital|radiology|oncology|cardiology|biomedical|diagnos|drug|trial|patient|doctor)s?\b/i.test(t)) score += 4;
  if (/\b(preprint|study|randomized|peer[- ]?review|journal|trial)\b/i.test(t)) score += 2;
  if (/\b(opinion|sponsored|advertorial)\b/i.test(t)) score -= 3;
  if (!isGoogleNewsLink(url)) score += 1;
  const now = Date.now(); const ts = parseDate(pubDate);
  if (ts) { const days = Math.max(0, (now - ts) / (24 * 3600 * 1000)); score += Math.max(0, 7 - days); }
  return score;
}

function dedupeInMemoryByUrl(items) {
  const seen = new Set();
  return items.filter((it) => {
    const key = normalizeUrl(it.url || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    it.url = key;
    return true;
  });
}

async function rankAndSelect(rawItems) {
  const pre = [];
  for (const it of rawItems) {
    const unwrapped = await unwrapGoogleNews(it.url);
    const norm = normalizeUrl(unwrapped);
    const host = hostnameOf(norm);
    pre.push({
      title: it.title,
      description: it.description,
      url: norm,
      source: it.source || (host ? (host === "news.google.com" ? "Google News" : host) : ""),
      pubDate: it.pubDate
    });
    await sleep(10);
  }
  const uniq = dedupeInMemoryByUrl(pre);
  const scored = uniq.map((it) => ({ ...it, score: relevanceScore(it) }));
  scored.sort((a, b) => (b.score - a.score) || (parseDate(b.pubDate) - parseDate(a.pubDate)));
  return scored;
}

// ------------------ DB helpers ------------------
async function pickOrderColumn() {
  for (const col of ORDER_CANDIDATES) {
    try {
      await supabase.from("medical_news").select("id", { head: true }).order(col, { ascending: false }).limit(1);
      return col;
    } catch (e) {
      if (e?.code && e.code !== "42703") throw e;
    }
  }
  return "id";
}

async function pruneToNewest(limit = 10) {
  const orderCol = await pickOrderColumn();
  const { data: keepRows, error: selErr } = await supabase
    .from("medical_news")
    .select("id")
    .order(orderCol, { ascending: false })
    .limit(limit);
  if (selErr) { console.error("prune select error:", selErr); return; }
  const keepIds = (keepRows || []).map((r) => r.id);
  if (keepIds.length === 0) return;
  const { error: delErr } = await supabase.from("medical_news").delete().not("id", "in", `(${keepIds.join(",")})`);
  if (delErr) console.error("prune delete error:", delErr);
  else console.log(`Pruned table to newest ${keepIds.length} rows (ordered by ${orderCol}).`);
}

async function dedupeByUrlInDb() {
  const orderCol = await pickOrderColumn();
  const { data, error } = await supabase
    .from("medical_news")
    .select("id,source_url,published_at,created_at")
    .order(orderCol, { ascending: false })
    .limit(200);
  if (error) { console.error("dedupe select error:", error); return; }
  const byUrl = new Map();
  for (const r of data || []) {
    const url = r.source_url || "";
    if (!url) continue;
    const ts = Date.parse(r.published_at || r.created_at || 0) || 0;
    const prev = byUrl.get(url);
    if (!prev || ts > prev.ts || (ts === prev.ts && r.id > prev.id)) {
      byUrl.set(url, { ts, keep: r.id });
    }
  }
  const keepSet = new Set(Array.from(byUrl.values()).map((v) => v.keep));
  const dupes = (data || []).map((r) => r.id).filter((id) => !keepSet.has(id));
  if (dupes.length === 0) { console.log("De-dup: nothing to remove."); return; }
  const { error: delErr } = await supabase.from("medical_news").delete().in("id", dupes);
  if (delErr) console.error("De-dup delete error:", delErr);
  else console.log(`De-dup: removed ${dupes.length} older duplicate row(s) by source_url.`);
}

// ------------------ Summarization & images ------------------
async function geminiSummarize({ title, description, url }) {
  if (!GEMINI_KEY) return null;
  const base = "https://generativelanguage.googleapis.com/v1/models";
  const endpoint = `${base}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  const prompt = `You are an assistant creating concise, neutral summaries of Medical/Health AI news.
Write 2–3 short bullet points (plain text; no markdown bullets) with core finding, context, and any caveats.
Avoid hype. Include specific model/study names if present.

Title: ${title}

Snippet:
${description}

Link: ${url}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt.slice(0, 8000) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
  };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim();
    return (text || "").replace(/\s+\n/g, "\n").trim();
  } catch (e) {
    console.error("Gemini error:", e.message || e);
    return null;
  }
}

async function geminiCategorize({ title, description }) {
  if (!GEMINI_KEY) return inferCategoryFromKeywords(title, description);
  const base = "https://generativelanguage.googleapis.com/v1/models";
  const endpoint = `${base}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  const categories = [
    "Drug Discovery",
    "Surgery",
    "Research",
    "Clinical Trials",
    "Diagnostics",
    "Medical Imaging",
    "Patient Care",
    "Genomics",
    "Telemedicine"
  ];
  const prompt = `You are a medical news classifier. Categorize this article into EXACTLY ONE category.

CATEGORIES:
- Drug Discovery: drug development, pharmaceuticals, molecular design
- Surgery: surgical procedures, robotic surgery, surgical planning
- Research: general medical research, studies, scientific findings
- Clinical Trials: patient trials, trial recruitment, trial design
- Diagnostics: disease detection, screening, diagnostic tools
- Medical Imaging: radiology, MRI, CT scans, X-ray, ultrasound
- Patient Care: hospital operations, patient management, nursing, bedside care
- Genomics: DNA, genetics, gene therapy, personalized medicine
- Telemedicine: remote care, virtual visits, telehealth

Article Title: ${title}

Article Content: ${description.substring(0, 1000)}

Respond with ONLY ONE category name from the list above. No explanation.`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.0, maxOutputTokens: 30 }
  };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ").trim();
    const matched = categories.find(c => text.toLowerCase().includes(c.toLowerCase()));
    return matched || inferCategoryFromKeywords(title, description);
  } catch (e) {
    console.error("Gemini categorize error:", e.message || e);
    return inferCategoryFromKeywords(title, description);
  }
}

function inferCategoryFromKeywords(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (/\b(drug|pharma|molecule|compound|therapeut|medication)\b/.test(text)) return "Drug Discovery";
  if (/\b(surgery|surgical|operation|robotic surg)\b/.test(text)) return "Surgery";
  if (/\b(trial|clinic[^\s]*\s+trial|patient enrollment|randomized)\b/.test(text)) return "Clinical Trials";
  if (/\b(diagnos|detect|screen|biomarker|early detection)\b/.test(text)) return "Diagnostics";
  if (/\b(imaging|radiology|mri|ct scan|x-ray|ultrasound|scan)\b/.test(text)) return "Medical Imaging";
  if (/\b(patient care|hospital|nursing|bedside|icu|emergency|ed triage)\b/.test(text)) return "Patient Care";
  if (/\b(genom|dna|gene|genetic|crispr|sequenc)\b/.test(text)) return "Genomics";
  if (/\b(telemedicine|telehealth|remote|virtual visit|video consult)\b/.test(text)) return "Telemedicine";

  return "Research";
}

async function fetchHtml(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "MedNewsAI/1.0 (+https://mednewsai.com)" } });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

function extractArticleContent(html, url) {
  if (!html) return null;

  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const description = ogDesc?.[1] || metaDesc?.[1] || '';

  const articleTags = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i
  ];

  let content = '';
  for (const regex of articleTags) {
    const match = html.match(regex);
    if (match && match[1]) {
      content = match[1];
      break;
    }
  }

  if (!content) return stripHtml(description);

  const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  let text = paragraphs
    .map(p => stripHtml(p))
    .filter(p => p.length > 50 && !p.match(/cookie|privacy policy|subscribe|sign up|advertisement/i))
    .slice(0, 8)
    .join('\n\n');

  if (text.length < 200 && description) {
    text = stripHtml(description);
  }

  return text || null;
}
const absolutize = (base, maybe) => { try { return new URL(maybe, base).toString(); } catch { return ""; } };
const looksLikeLogo = (u = "") => {
  const x = u.toLowerCase();
  return x.includes("logo") || x.includes("sprite") || x.includes("icon") || x.endsWith(".svg");
};
function extractOgImage(html, baseUrl) {
  if (!html) return "";
  const metas = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/i
  ];
  for (const re of metas) {
    const m = html.match(re);
    if (m && m[1]) {
      const abs = absolutize(baseUrl, m[1].trim());
      if (abs && !looksLikeLogo(abs) && abs.startsWith("http")) {
        const lowerAbs = abs.toLowerCase();
        if (!lowerAbs.includes('default') && !lowerAbs.includes('placeholder') && abs.length > 50) {
          return abs;
        }
      }
    }
  }
  const imgs = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
  for (const imgTag of imgs.slice(0, 10)) {
    const m = imgTag.match(/src=["']([^"']+)["']/);
    if (m && m[1]) {
      const abs = absolutize(baseUrl, m[1].trim());
      if (abs && !looksLikeLogo(abs) && abs.startsWith("http")) {
        const lowerAbs = abs.toLowerCase();
        if (!lowerAbs.includes('default') && !lowerAbs.includes('placeholder') && abs.length > 50) {
          const width = imgTag.match(/width=["']?(\d+)/i);
          const height = imgTag.match(/height=["']?(\d+)/i);
          if (width && height && parseInt(width[1]) > 200 && parseInt(height[1]) > 200) {
            return abs;
          }
        }
      }
    }
  }
  return "";
}
async function discoverImageForArticle({ title, url, category }) {
  const html = await fetchHtml(url);
  const og = extractOgImage(html || "", url);
  if (og) return { image_url: og, image_attribution: "" };

  if (PEXELS_KEY) {
    try {
      const categoryMap = {
        "Drug Discovery": "laboratory research microscope",
        "Surgery": "surgery medical operation",
        "Research": "medical research laboratory",
        "Clinical Trials": "clinical trial medical test",
        "Diagnostics": "medical diagnosis doctor",
        "Medical Imaging": "medical imaging xray mri",
        "Patient Care": "doctor patient hospital care",
        "Genomics": "dna genetics laboratory",
        "Telemedicine": "telemedicine doctor video call"
      };

      const categoryTerm = categoryMap[category] || "medical healthcare";
      const searchTerms = [
        `${categoryTerm} technology`,
        `medical healthcare professional`,
        `hospital medical equipment`
      ];

      for (const searchTerm of searchTerms) {
        const q = encodeURIComponent(searchTerm);
        const api = `https://api.pexels.com/v1/search?query=${q}&per_page=5`;
        const res = await fetch(api, { headers: { Authorization: PEXELS_KEY } });

        if (res.ok) {
          const json = await res.json();
          const photos = json.photos || [];

          for (const photo of photos) {
            const alt = (photo.alt || "").toLowerCase();
            const hasFlag = alt.includes("flag") || alt.includes("israel") || alt.includes("political");
            const hasUnrelated = alt.includes("fashion") || alt.includes("model") || alt.includes("beauty");

            if (!hasFlag && !hasUnrelated && photo?.src?.large) {
              return {
                image_url: photo.src.large,
                image_attribution: `Photo: ${photo.photographer || "Pexels"} / Pexels (${photo.url || "https://www.pexels.com"})`
              };
            }
          }
        }
      }

      console.warn("No suitable Pexels image found after filtering");
    } catch (e) {
      console.warn("Pexels fetch failed:", e.message || e);
    }
  }

  return { image_url: "", image_attribution: "" };
}

// ------------------ Write helpers (no unique index required) ------------------
async function upsertByUrl_NoIndex(row) {
  const { data: existing, error: selErr } = await supabase.from("medical_news").select("id").eq("source_url", row.source_url).limit(1);
  if (selErr) { console.error("select existing error:", selErr); return false; }
  if (existing && existing.length) {
    const id = existing[0].id;
    const { error: updErr } = await supabase.from("medical_news").update(row).eq("id", id);
    if (updErr) { console.error("update error:", updErr); return false; }
    return true;
  }
  const { error: insErr } = await supabase.from("medical_news").insert([row]);
  if (insErr) { console.error("insert error:", insErr); return false; }
  return true;
}

// ------------------ Main ------------------
async function main() {
  console.log(`Crawler start (auth: ${process.env.SUPABASE_SERVICE_ROLE ? "service-role" : "anon"})`);

  // 1) Gather & rank
  const raw = await gatherCandidates();
  console.log(`Fetched ${raw.length} candidates`);
  const ranked = await rankAndSelect(raw);

  // 2) ALWAYS take top 10 (replace oldest later)
  const batch = ranked.slice(0, TAKE_TOP);
  console.log(`Selected ${batch.length} items (always-top-10 mode)`);

  // 3) Summarize + image + write
  let wrote = 0;
  for (const it of batch) {
    try {
      const actualUrl = await unwrapGoogleNews(it.url);
      console.log(`  Fetching content from: ${actualUrl.substring(0, 60)}...`);
      const html = await fetchHtml(actualUrl);
      const extractedContent = extractArticleContent(html, actualUrl);

      const cleanDescription = stripHtml(it.description || "");
      const contentForSummary = extractedContent || cleanDescription || it.title;

      const [summary, category] = await Promise.all([
        geminiSummarize({
          title: it.title,
          description: contentForSummary.substring(0, 2000),
          url: actualUrl
        }),
        geminiCategorize({
          title: it.title,
          description: contentForSummary.substring(0, 1500)
        })
      ]);

      const { image_url, image_attribution } = await discoverImageForArticle({
        title: it.title,
        url: actualUrl,
        category: category || "Research"
      });

      let finalSummary = summary || cleanDescription || it.title;
      let finalContent = extractedContent || summary || cleanDescription || it.title;

      if (finalContent.length < 100) {
        finalContent = `${it.title}\n\n${cleanDescription || 'No additional content available.'}`;
        finalSummary = cleanDescription || it.title;
      }

      const row = {
        title: it.title || "(untitled)",
        summary: finalSummary,
        content: finalContent,
        source_url: it.url,
        source: it.source || hostnameOf(it.url) || "",
        original_source: it.source || hostnameOf(it.url) || "Unknown",
        category: category || "Research",
        published_at: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
        image_url,
        image_attribution
      };

      const ok = await upsertByUrl_NoIndex(row);
      if (ok) { wrote++; console.log(`+ Wrote: ${row.title.slice(0, 100)} — ${row.source_url}`); }
      await sleep(90);
    } catch (e) {
      console.error("Item error:", it.url, e.message || e);
    }
  }

  console.log(`Write phase done — wrote/updated ${wrote} item(s).`);

  // 4) De-dup by URL in DB and prune to newest 10
  await dedupeByUrlInDb();
  await pruneToNewest(10);

  console.log("Crawler finished.");
}

main().catch((e) => { console.error(e); process.exit(1); });
