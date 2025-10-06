const { sb } = require("./lib/supabase-server.cjs");

(async () => {
  const since = new Date(Date.now() - 12*3600*1000).toISOString(); // last 12h
  // Pick a real order column
  const orderCandidates = ["published_at","created_at","inserted_at","date","id"];
  let orderCol = "id";
  for (const c of orderCandidates) {
    try {
      await sb.from("medical_news").select("id", { head: true }).order(c, { ascending: false }).limit(1);
      orderCol = c; break;
    } catch (e) {
      if (e?.code && e.code !== "42703") throw e;
    }
  }

  // OR filter: no expressions (PostgREST limitation)
  const ors = ["published_at","created_at"].map(c => `${c}.gte.${since}`).join(",");
  const { data, error, count } = await sb
    .from("medical_news")
    .select("id,title,source,url,published_at,created_at", { count: "exact" })
    .or(ors)
    .order(orderCol, { ascending: false })
    .limit(25);

  if (error) { console.error("Verify failed:", error); process.exit(1); }

  const n = typeof count === "number" ? count : (data?.length || 0);
  console.log(`Inserted/updated in last 12h: ${n} (ordered by ${orderCol})`);
  (data || []).forEach((r, i) => {
    console.log(`#${i+1}: ${r.title} • ${r.source || "(no source)"} • ${r.published_at || r.created_at} • ${r.url}`);
  });
})();
