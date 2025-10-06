/**
 * Schema-flexible exporter:
 * - Reads from `medical_news` with adaptive column mapping (url/link/article_url, etc.).
 * - Tries several sort columns (published_at, created_at, inserted_at, date, id).
 * - Outputs /public/feed.json and a simple /public/index.html.
 */

const fs = require("fs");
const path = require("path");
const { sb: supabase } = require("./lib/supabase-server.cjs");

const OUT_DIR = path.join(__dirname, "..", "public");

// Small helpers
const pick = (row, keys, fallback = "") => {
  for (const k of keys) {
    if (k in row && row[k] != null) return row[k];
  }
  return fallback;
};

async function fetchRows() {
  // Try a few common order columns; fall back to unordered if none exist
  const orderCandidates = [
    "published_at",
    "created_at",
    "inserted_at",
    "publishedAt",
    "date",
    "id"
  ];

  for (const col of orderCandidates) {
    const { data, error } = await supabase
      .from("medical_news")
      .select("*")
      .order(col, { ascending: false })
      .limit(300);

    if (!error) {
      console.log(`Export: using order by ${col}`);
      return data || [];
    }
    if (error?.code !== "42703") {
      // Not a "column does not exist" error -> surface it
      console.error("Supabase select error:", error);
      process.exit(1);
    }
    // else: column missing; try next candidate
  }

  // Last resort: no ordering
  const { data, error } = await supabase.from("medical_news").select("*").limit(300);
  if (error) {
    console.error("Supabase select error (fallback):", error);
    process.exit(1);
  }
  console.log("Export: no order column found; using unordered results.");
  return data || [];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const rows = await fetchRows();

  const items = rows.map((it) => {
    const title = pick(it, ["title", "headline", "name"], "");
    const summary = pick(it, ["summary", "abstract", "description", "ai_summary", "gemini_summary"], "");
    const url = pick(it, ["url", "link", "article_url", "source_url", "canonical_url"], "");
    const source = pick(it, ["source", "site", "publisher", "domain"], "");
    const publishedAt =
      pick(it, ["published_at", "publishedAt", "pub_date", "date", "created_at", "inserted_at"], null) || null;
    const imageUrl = pick(it, ["image_url", "imageUrl", "image", "thumbnail", "thumb", "cover"], "");
    const imageAttribution = pick(it, ["image_attribution", "attribution", "image_credit", "credit"], "");

    return { title, summary, url, source, publishedAt, imageUrl, imageAttribution };
  });

  fs.writeFileSync(path.join(OUT_DIR, "feed.json"), JSON.stringify(items, null, 2));

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MedNewsAI</title>
</head>
<body>
<header><h1>Medical & Health AI News</h1></header>
<main id="app">Loading…</main>
<footer style="margin-top:2rem;font-size:.9rem;opacity:.8">
  Summaries are AI-generated. Always read the original source.
</footer>
<script>
(async function () {
  const res = await fetch('/feed.json');
  const data = await res.json();
  const app = document.getElementById('app');
  app.innerHTML = data.map(it => {
    const pub = it.publishedAt ? new Date(it.publishedAt).toLocaleString() : '';
    const img = it.imageUrl ? '<img src="'+it.imageUrl+'" alt="" style="max-width:100%;border-radius:12px;margin:.5rem 0"/>' : '';
    const attr = it.imageAttribution ? '<div style="font-size:.8rem;opacity:.8">'+it.imageAttribution+'</div>' : '';
    return \`
      <article style="border:1px solid #ddd;padding:12px;border-radius:12px;margin:12px 0">
        <h2 style="margin:0 0 8px 0">\${it.title || 'Untitled'}</h2>
        <div style="font-size:.9rem;opacity:.8;margin-bottom:8px">
          <span>\${it.source || 'Source'}</span> • <time>\${pub}</time>
        </div>
        \${img}
        <p>\${(it.summary || '').replace(/</g,'&lt;')}</p>
        <p><a href="\${it.url}" rel="noopener nofollow" target="_blank">Read the original</a></p>
        \${attr}
        <div style="font-size:.8rem;opacity:.8;margin-top:6px">AI-generated summary; verify with source.</div>
      </article>\`;
  }).join('');
}());
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), html);

  console.log(`Exported ${items.length} items to /public`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
