/**
 * Verify how many rows were inserted/updated in the last 12 hours.
 * - Avoids PostgREST expressions (no coalesce).
 * - Tries several order columns until one works.
 * - Prints a small sample of titles to the Actions log.
 */

const { sb } = require("./lib/supabase-server.cjs");

async function pickOrderColumn(candidates) {
  for (const col of candidates) {
    try {
      // Try to order by this column; if it doesn't exist, PostgREST returns 42703
      await sb.from("medical_news").select("id", { head: true }).order(col, { ascending: false }).limit(1);
      return col;
    } catch (e) {
      if (e?.code && e.code !== "42703") throw e;
    }
  }
  return "id";
}

(async () => {
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const orderCol = await pickOrderColumn(["published_at", "created_at", "inserted_at", "date", "id"]);

  // Build an OR filter without expressions (PostgREST limitation)
  const ors = ["published_at", "created_at"]
    .map((c) => `${c}.gte.${since}`)
    .join(",");

  const { data, error, count } = await sb
    .from("medical_news")
    .select("id,title,source,url,published_at,created_at", { count: "exact" })
    .or(ors)
    .order(orderCol, { ascending: false })
    .limit(25);

  if (error) {
    console.error("Verify failed:", error);
    process.exit(1);
  }

  const n = typeof count === "number" ? count : (data?.length || 0);
  console.log(`Inserted/updated in last 12h: ${n} (ordered by ${orderCol})`);

  (data || []).forEach((r, i) => {
    console.log(
      `#${i + 1}: ${r.title || "(no title)"} • ${r.source || "(no source)"} • ${r.published_at || r.created_at} • ${r.url || ""}`
    );
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
