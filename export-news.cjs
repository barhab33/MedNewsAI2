/**
 * Example server-side export that reads from `medical_news`.
 * Use this if you had an older exporter with hard-coded passwords—this one uses the shared client.
 */
const fs = require("fs");
const path = require("path");
const { sb: supabase } = require("./lib/supabase-server.cjs");

async function main() {
  const { data, error } = await supabase
    .from("medical_news")
    .select("title,summary,url,source,published_at,image_url,image_attribution")
    .order("published_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  const out = path.join(__dirname, "..", "data", "export.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data || [], null, 2));
  console.log("Wrote", (data || []).length, "records to", out);
}

main().catch((e) => { console.error(e); process.exit(1); });
