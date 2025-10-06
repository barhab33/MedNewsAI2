/**
 * scripts/db-sanity.cjs
 * Prints auth mode, counts, newest 10, and tests a write (insert + delete).
 */
const { sb } = require("./lib/supabase-server.cjs");

async function pickOrderColumn() {
  const candidates = ["published_at", "created_at", "inserted_at", "date", "id"];
  for (const col of candidates) {
    try {
      await sb.from("medical_news").select("id", { head: true }).order(col, { ascending: false }).limit(1);
      return col;
    } catch (e) {
      if (e?.code && e.code !== "42703") throw e;
    }
  }
  return "id";
}

(async () => {
  const auth = process.env.SUPABASE_SERVICE_ROLE ? "service-role" : "anon";
  console.log("Auth mode:", auth);

  // Total count
  const { count: total, error: countErr } = await sb
    .from("medical_news")
    .select("id", { count: "exact", head: true });
  if (countErr) {
    console.error("Count error:", countErr);
  } else {
    console.log("Total rows in medical_news:", total);
  }

  // Newest 10
  const orderCol = await pickOrderColumn();
  const { data: newest, error: selErr } = await sb
    .from("medical_news")
    .select("id,title,source,published_at,created_at,url")
    .order(orderCol, { ascending: false })
    .limit(10);
  if (selErr) {
    console.error("Select newest error:", selErr);
  } else {
    console.log(`Newest 10 (ordered by ${orderCol}):`);
    (newest || []).forEach((r, i) => {
      console.log(
        `#${i + 1}: id=${r.id} • ${r.title?.slice(0, 90) || "(no title)"} • ${r.source || ""} • ${r.published_at || r.created_at || ""} • ${r.url || ""}`
      );
    });
  }

  // Write probe (insert + delete)
  const probeUrl = "https://example.com/_mednewsai_probe";
  const probeRow = {
    title: "MedNewsAI probe row (safe to delete)",
    summary: "probe",
    url: probeUrl,
    source: "diagnostics",
    published_at: new Date().toISOString(),
    image_url: "",
    image_attribution: ""
  };

  console.log("Trying insert probe row…");
  const { error: insErr } = await sb.from("medical_news").insert([probeRow]);
  if (insErr) {
    console.error("Insert FAILED — this means your key cannot write (RLS/permissions).", insErr);
    process.exit(0); // stop here; exporter will keep reusing old rows
  } else {
    console.log("Insert OK. Cleaning up (delete)...");
    const { error: delErr } = await sb.from("medical_news").delete().eq("url", probeUrl);
    if (delErr) {
      console.error("Delete cleanup failed:", delErr);
    } else {
      console.log("Delete OK. Writes are working ✅");
    }
  }
})();
