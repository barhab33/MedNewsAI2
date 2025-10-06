/**
 * export-to-public.cjs (root)
 * - Exports the newest 10 rows from `medical_news`
 * - Adds a harmless `exportedAt` field to EACH item so feed.json changes every run
 * - Writes /public/feed.json and /public/feed_meta.json
 * - Loud logs (rows, order, file sizes)
 */
const fs = require("fs");
const path = require("path");
const { sb: supabase } = require("./scripts/lib/supabase-server.cjs");

const OUT_DIR = path.join(__dirname, "public");

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
  if (error) { console.error("Supabase select error:", error); process.exit(1); }
  console.log(`Export: order by ${orderCol}; rows=${data?.length || 0}`);
  return data || [];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("Writing to:", OUT_DIR);

  const rows = await fetchTop10();
  const exportedAt = new Date().toISOString();

  const items = rows.map((it) => {
    const title = pick(it, ["title","headline","name"], "");
    const summary = pick(it, ["summary","abstract","description","ai_summary","gemini_summary"], "");
    const url = pick(it, ["url","link","article_url","source_url","canonical_url"], "");
    let source = pick(it, ["source","site","publisher","domain"], "");
    const publishedAt = pick(it, ["published_at","publishedAt","pub_date","date","created_at","inserted_at"], null) || null;
    const imageUrl = pick(it, ["image_url","imageUrl","image","thumbnail","thumb","cover"], "");
    const imageAttribution = pick(it, ["image_attribution","attribution","image_credit","credit"], "");
    if (!source && url) { try { source = new URL(url).hostname.replace(/^www\./,""); } catch {} }
    // Add exportedAt so feed.json content changes on each run (frontend can ignore this field)
    return { title, summary, url, source, publishedAt, imageUrl, imageAttribution, exportedAt };
  });

  const feedPath = path.join(OUT_DIR, "feed.json");
  const metaPath = path.join(OUT_DIR, "feed_meta.json");

  fs.writeFileSync(feedPath, JSON.stringify(items, null, 2));
  fs.writeFileSync(metaPath, JSON.stringify({
    generatedAt: exportedAt,
    itemCount: items.length
  }, null, 2));

  const feedStat = fs.statSync(feedPath);
  const metaStat = fs.statSync(metaPath);
  console.log(`Wrote feed.json (${feedStat.size} bytes) and feed_meta.json (${metaStat.size} bytes).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
