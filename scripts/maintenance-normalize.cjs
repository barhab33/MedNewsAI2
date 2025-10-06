/**
 * scripts/maintenance-normalize.cjs
 *
 * One-time/recurring cleanup:
 * - Convert google news redirect URLs to canonical targets
 * - Normalize URLs (strip tracking)
 * - De-dup by URL (keep newest)
 * - Prune table to newest 10
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.host = u.host.toLowerCase();
    const STRIP_PREFIXES = ["utm_", "fbclid", "gclid", "mc_cid", "mc_eid", "igshid"];
    const keep = [];
    for (const [k, v] of u.searchParams.entries()) {
      const lower = k.toLowerCase();
      const isTracking =
        STRIP_PREFIXES.some((p) => lower.startsWith(p)) || lower === "fbclid" || lower === "gclid";
      if (!isTracking) keep.push([k, v]);
    }
    keep.sort(([a], [b]) => a.localeCompare(b));
    u.search = "";
    for (const [k, v] of keep) u.searchParams.append(k, v);
    if (u.pathname === "/") u.pathname = "";
    return u.toString();
  } catch { return raw; }
}
const isGoogleNewsLink = (u) => /^https?:\/\/news\.google\.com\/rss\//i.test(u || "");
const hostnameOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
async function unwrapGoogleNews(url) {
  try {
    if (!isGoogleNewsLink(url)) return url;
    const r = await fetch(url, { redirect: "follow", method: "HEAD" });
    if (r.ok) return normalizeUrl(r.url || url);
  } catch {}
  return normalizeUrl(url);
}

async function pickOrderColumn() {
  const candidates = ["published_at", "created_at", "inserted_at", "date", "id"];
  for (const col of candidates) {
    try {
      await supabase.from("medical_news").select("id", { head: true }).order(col, { ascending: false }).limit(1);
      return col;
    } catch (e) {
      if (e?.code && e.code !== "42703") throw e;
    }
  }
  return "id";
}

async function dedupeAndPrune() {
  const orderCol = await pickOrderColumn();
  const { data, error } = await supabase
    .from("medical_news")
    .select("id,url,published_at,created_at")
    .order(orderCol, { ascending: false })
    .limit(300);
  if (error) { console.error("select error:", error); return; }
  const byUrl = new Map();
  for (const r of data || []) {
    const url = r.url || "";
    if (!url) continue;
    const ts = Date.parse(r.published_at || r.created_at || 0) || 0;
    const prev = byUrl.get(url);
    if (!prev || ts > prev.ts || (ts === prev.ts && r.id > prev.id)) {
      byUrl.set(url, { ts, keep: r.id });
    }
  }
  const keepSet = new Set(Array.from(byUrl.values()).map((v) => v.keep));
  const dupes = (data || []).map((r) => r.id).filter((id) => !keepSet.has(id));
  if (dupes.length) {
    const { error: delErr } = await supabase.from("medical_news").delete().in("id", dupes);
    if (delErr) console.error("De-dup delete error:", delErr);
    else console.log(`De-dup: removed ${dupes.length} duplicate rows.`);
  } else {
    console.log("De-dup: none.");
  }

  // prune to newest 10
  const { data: keepRows, error: selErr } = await supabase
    .from("medical_news")
    .select("id")
    .order(orderCol, { ascending: false })
    .limit(10);
  if (selErr) { console.error("prune select error:", selErr); return; }
  const keepIds = (keepRows || []).map((r) => r.id);
  if (!keepIds.length) return;
  const { error: delErr2 } = await supabase.from("medical_news").delete().not("id", "in", keepIds);
  if (delErr2) console.error("prune delete error:", delErr2);
  else console.log(`Pruned to newest ${keepIds.length} rows.`);
}

(async () => {
  // Load recent records that likely contain old google news links
  const orderCol = await pickOrderColumn();
  const { data, error } = await supabase
    .from("medical_news")
    .select("id,title,url,source,published_at,created_at")
    .order(orderCol, { ascending: false })
    .limit(200);
  if (error) { console.error("select error:", error); process.exit(1); }

  let changed = 0;
  for (const row of data || []) {
    const u = row.url || "";
    if (!u) continue;
    if (!isGoogleNewsLink(u) && normalizeUrl(u) === u) continue;

    const unwrapped = await unwrapGoogleNews(u);
    const norm = normalizeUrl(unwrapped);
    if (!norm || norm === u) continue;

    const newSource = hostnameOf(norm) || row.source || "Unknown";
    const upd = { url: norm, source: newSource };
    const { error: updErr } = await supabase.from("medical_news").update(upd).eq("id", row.id);
    if (!updErr) { changed++; console.log(`Updated URL → ${norm}`); }
    else console.error("update error:", updErr);
  }

  console.log(`Normalized ${changed} URL(s).`);
  await dedupeAndPrune();
})().catch((e) => { console.error(e); process.exit(1); });
