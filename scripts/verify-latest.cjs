/**
 * scripts/verify-latest.cjs
 * Verifies how many rows were inserted/updated in the last 12 hours.
 * - Avoids selecting non-existent columns (no `url`).
 * - Detects which time columns exist and builds a safe OR filter.
 * - Picks an order column that actually exists.
 * - Prints up to 25 recent rows (id, title, source, timestamps).
 */
const { sb } = require("./lib/supabase-server.cjs");

async function columnExists(col) {
  try {
    await sb.from("medical_news").select("id", { head: true }).order(col, { ascending: false }).limit(1);
    return true;
  } catch (e) {
    if (e?.code === "42703") return false;
    throw e;
  }
}
async function pickOrderColumn() {
  const candidates = ["published_at","created_at","inserted_at","date","id"];
  for (const col of candidates) if (await columnExists(col)) return col;
  return "id";
}
(async () => {
  const since = new Date(Date.now() - 12*3600*1000).toISOString();
  const hasPublished = await columnExists("published_at");
  const hasCreated = await columnExists("created_at");
  const orderCol = await pickOrderColumn();

  let q = sb.from("medical_news").select(
    ["id","title","source", hasPublished ? "published_at" : null, hasCreated ? "created_at" : null]
      .filter(Boolean).join(","), { count: "exact" }
  ).order(orderCol, { ascending: false }).limit(25);

  if (hasPublished || hasCreated) {
    const ors = []
      .concat(hasPublished ? [`published_at.gte.${since}`] : [])
      .concat(hasCreated ? [`created_at.gte.${since}`] : [])
      .join(",");
    q = q.or(ors);
  }

  const { data, error, count } = await q;
  if (error) { console.error("Verify failed:", error); process.exit(1); }

  const n = typeof count === "number" ? count : (data?.length || 0);
  console.log(`Inserted/updated in last 12h: ${n} (ordered by ${orderCol})`);
  (data || []).forEach((r,i) => {
    const ts = r.published_at || r.created_at || "";
    console.log(`#${i+1}: ${r.title || "(no title)"} • ${r.source || "(no source)"} • ${ts}`);
  });

  // Optional: show total rows (should be 10 after prune)
  const { count: totalCount } = await sb.from("medical_news").select("id", { count: "exact", head: true });
  console.log(`Total rows in medical_news: ${totalCount}`);
})().catch((e)=>{ console.error(e); process.exit(1); });
