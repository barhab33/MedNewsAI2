// Simple connectivity test against `medical_news` using the shared client.
const { sb: supabase } = require("./lib/supabase-server.cjs");

async function run() {
  const { data, error } = await supabase
    .from("medical_news")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Connection test failed:", error);
    process.exit(1);
  }
  console.log("Connection OK. Example row:", data?.[0] || "(none)");
}

run().catch((e) => { console.error(e); process.exit(1); });
