/**
 * Export latest items from `medical_news` to /public for your static site.
 * - Uses shared Supabase client (Bolt shim aware).
 * - Writes public/feed.json and a minimal public/index.html (fallback).
 */

const fs = require("fs");
const path = require("path");

// Friendly guard so CI errors are obvious:
const miss = [];
if (!process.env.VITE_BOLTDATABASE_URL && !process.env.VITE_SUPABASE_URL) miss.push("VITE_BOLTDATABASE_URL");
if (!process.env.VITE_BOLTDATABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) miss.push("VITE_BOLTDATABASE_ANON_KEY");
if (miss.length) {
  console.error("Missing database credentials:", miss.join(", "));
  process.exit(1);
}

const { sb: supabase } = require("./lib/supabase-server.cjs");

const OUT_DIR = path.join(__dirname, "..", "public");

async function main() {
  // Ensure public dir
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Fetch latest items
  const { data, error } = await supabase
    .from("medical_news")
    .select("title, summary, url, source, published_at, image_url, image_attribution")
    .order("published_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Supabase select error:", error);
    process.exit(1);
  }

  // Normalize records a bit
  const items = (data || []).map((it) => ({
    title: it.title || "",
    summary: it.summary || "",
    url: it.url || "",
    source: it.source || "",
    publishedAt: it.published_at || null,
    imageUrl: it.image_url || "",
    imageAttribution: it.image_attribution || ""
  }));

  // Write feed.json for your frontend
  fs.writeFileSync(path.join(OUT_DIR, "feed.json"), JSON.stringify(items, null, 2));

  // Minimal index.html fallback (your real site can ignore this if using a SPA)
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
