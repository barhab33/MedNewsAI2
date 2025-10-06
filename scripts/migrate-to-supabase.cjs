/**
 * Migration helper template without hard-coded secrets.
 * Adjust queries as needed, then run locally with your .env (DO NOT COMMIT service key).
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

async function main() {
  // Example: ensure table exists (create in SQL editor ideally).
  // Here we just test a select so the script is safe by default.
  const { data, error } = await supabase
    .from("medical_news")
    .select("count")
    .limit(1);

  if (error) {
    console.error("Migration connectivity check failed:", error);
    process.exit(1);
  }

  console.log("Migration: connectivity OK. Implement your move logic here.");
}

main().catch((e) => { console.error(e); process.exit(1); });
