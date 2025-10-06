/**
 * Placeholder crawler wrapper (kept minimal to avoid breaking your pipeline).
 * - Verifies DB credentials and connectivity via shared client.
 * - If you already have a crawler, you can replace the TODO section with your logic.
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

async function main() {
  // Quick connectivity check
  const { data, error } = await supabase
    .from("medical_news")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Supabase connection failed:", error);
    process.exit(1);
  }

  console.log("Supabase connectivity OK. Latest row id:", data?.[0]?.id ?? "none");

  // TODO: If you have a real crawler, place it here (fetch sources, LLM summaries, inserts).
  // Keep inserts/updates using the same `supabase` client.
  // Example insert (uncomment when needed):
  //
  // const { error: insErr } = await supabase.from("medical_news").insert([{
  //   title: "Example",
  //   summary: "LLM summary here",
  //   url: "https://example.com/article",
  //   source: "Example Source",
  //   published_at: new Date().toISOString(),
  //   image_url: "",
  //   image_attribution: ""
  // }]);
  // if (insErr) { console.error("Insert failed:", insErr); process.exit(1); }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
