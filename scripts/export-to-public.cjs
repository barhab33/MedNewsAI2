/**
 * scripts/export-to-public.cjs
 * - Exports the newest 10 rows from `medical_news`
 * - Schema-flexible (adapts to your columns)
 * - Writes /public/feed.json and /public/feed_meta.json
 */

const fs = require("fs");
const path = require("path");
const { sb: supabase } = require("./lib/supabase-server.cjs");

const OUT_DIR = path.join(__dirname, "..", "public");

// helpers
const pick = (row, keys, fallback = "") => {
  for (const k of keys) if (k in row && row[k] != null) return row[k];
  return fallback;
};

async function pickOrderColumn() {
  const candidates = ["published_at", "created_at", "inserted_at", "date", "id"];
  for (const col of candidates) {
    try {
      await supabase.from("medical_news").select("id", { head: true }).order(col, { ascending: false }).limit(1);
      return col;
    } catch (e) {
      if (e?.code && e.code !== "42703") throw e;
    }
  }
  return "id";
}

async function fetchTop10() {
  const orderCol = await pickOrderColumn();
  const { data, error } = await supabase
    .from("medical_news")
    .select("*")
    .order(orderCol, { ascending: false })
    .limit(10);

  if (error) {
    console.error("Supabase select error:", error);
    process.exit(1);
  }
  console.log(`Export: using order by ${orderCol}`);
  return data || [];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const rows = await fetchTop10();

  const items = rows.map((it) => {
    const id = it.id || "";
    const title = pick(it, ["title", "headline", "name"], "");
    const summary = pick(it, ["summary", "abstract", "description", "ai_summary", "gemini_summary"], "");
    const content = pick(it, ["content", "body", "text", "article_text"], "");
    const category = pick(it, ["category", "tag", "section"], "Medical AI");
    const url = pick(it, ["source_url", "url", "link", "article_url", "canonical_url"], "");
    let source = pick(it, ["source", "site", "publisher", "domain"], "");
    const original_source = pick(it, ["original_source", "source", "site"], "");
    const publishedAt = pick(it, ["published_at", "publishedAt", "pub_date", "date", "created_at", "inserted_at"], null) || null;
    const imageUrl = pick(it, ["image_url", "imageUrl", "image", "thumbnail", "thumb", "cover"], "");
    const created_at = pick(it, ["created_at", "createdAt", "inserted_at"], null) || null;

    if (!source && url) {
      try { source = new URL(url).hostname.replace(/^www\./, ""); } catch {}
    }

    return {
      id,
      title,
      summary,
      content,
      category,
      source_url: url,
      source,
      original_source,
      published_at: publishedAt,
      image_url: imageUrl,
      created_at
    };
  });

  const feedPath = path.join(OUT_DIR, "feed.json");
  const metaPath = path.join(OUT_DIR, "feed_meta.json");

  fs.writeFileSync(feedPath, JSON.stringify(items, null, 2));
  fs.writeFileSync(metaPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    itemCount: items.length
  }, null, 2));

  console.log(`Exported ${items.length} items to /public (feed.json + feed_meta.json)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
