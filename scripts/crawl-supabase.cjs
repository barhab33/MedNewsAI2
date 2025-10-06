/**
 * Minimal crawler placeholder to satisfy the workflow.
 * Verifies DB connectivity using the shared client and exits cleanly.
 */
const { sb: supabase } = require("./lib/supabase-server.cjs");

async function main() {
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

  // TODO: Put your actual crawl/summarize/insert logic here when ready.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
