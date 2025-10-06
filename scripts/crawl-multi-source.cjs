/**
 * Legacy multi-source crawler placeholder that now uses the shared client.
 * If you had real crawling logic here, keep it and swap the client to `supabase`.
 */
const { sb: supabase } = require("./lib/supabase-server.cjs");

async function main() {
  // Example: list count
  const { count, error } = await supabase
    .from("medical_news")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Count failed:", error);
    process.exit(1);
  }
  console.log("medical_news rows:", count);
}

main().catch((e) => { console.error(e); process.exit(1); });
