/**
 * scripts/maintenance-normalize.cjs
 *
 * Normalizes article URLs and keeps only the newest N rows.
 * - Auto-detects the URL column by checking Supabase response.error (no try/catch)
 * - Converts Google News redirect links to canonical targets
 * - Normalizes/strips tracking params
 * - De-duplicates by URL (keeps newest row)
 * - Prunes table to newest LIMIT rows
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

const TABLE = "medical_news";
const LIMIT_KEEP = 10;

// ---------- URL helpers ----------
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
  } catch {
    return raw;
  }
}

const isGoogleNewsLink = (u) => /^https?:\/\/news\.google\.com\/rss\//i.test(u || "");
const hostnameOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

async function unwrapGoogleNews(url) {
  try {
    if (!isGoogleNewsLink(url)) return url;
    const r = await fetch(url, { redirect: "follow", method: "HEAD" });
    if (r.ok) return normalizeUrl(r.url || url);
  } catch {}
  return normalizeUrl(url);
}

// ---------- Column detection (uses response.error, not exceptions) ----------
async function hasColumn(col) {
  // Use a HEAD-like select and inspect the returned error object
  const { error } = await supabase.from(TABLE).select(`id,${col}`, { head: true }).limit(1);
  if (!error) return true;
  if (error.code === "42703") return false; // undefined_column
  // Any other error we treat as "unknown but assume column exists" so we don't block
  return true;
}

async function pickUrlColumn() {
  const candidates = ["url", "source_url", "article_url", "link"];
  for (const col of candidates) {
    const ok = await hasColumn(col);
    if (ok) return col;
  }
  return null;
}

async function pickOrderColumn() {
  const candidates = ["published_at", "created_at", "inserted_at", "date", "id"];
  for (const col of candidates) {
    const ok = await hasColumn(col);
    if (ok) return col;
  }
  return "id";
}

// ---------- Main ----------
(async () => {
  const urlCol = await pickUrlColumn();
  const orderCol = await pickOrderColumn();

  if (!urlCol) {
    console.log(`[maintenance] No URL-like column on ${TABLE}; skipping normalize. (Tried url, source_url, article_url, link)`);
    // Still prune newest LIMIT_KEEP if possible
    const { data: keepRows, error: selErr } = await supabase
      .from(TABLE)
      .select("id")
      .order(orderCol, { ascending: false })
      .limit(LIMIT_KEEP);
    if (!selErr && keepRows?.length) {
      const keepIds = keepRows.map((r) => r.id);
      const { error: delErr } = await supabase.from(TABLE).delete().not("id", "in", keepIds);
      if (delErr) console.error("[maintenance] prune delete error:", delErr);
      else console.log(`[maintenance] Pruned table to newest ${keepIds.length} rows (ordered by ${orderCol}).`);
    }
    process.exit(0);
  }

  console.log(`[maintenance] Using URL column: ${urlCol}`);
  console.log(`[maintenance] Ordering by: ${orderCol}`);

  // Load recent rows (grab plenty for dedupe)
  const { data, error } = await supabase
    .from(TABLE)
    .select(`id,title,${urlCol},source,published_at,created_at`)
    .order(orderCol, { ascending: false })
    .limit(300);

  if (error) {
    console.error("select error:", error);
    process.exit(1);
  }

  // Normalize & unwrap Google News links
  let changed = 0;
  for (const row of data || []) {
    const u = row[urlCol] || "";
    if (!u) continue;
    const unwrapped = await unwrapGoogleNews(u);
    const norm = normalizeUrl(unwrapped);
    if (!norm || norm === u) continue;

    const newSource = hostnameOf(norm) || row.source || "Unknown";
    const upd = { [urlCol]: norm, source: newSource };

    const { error: updErr } = await supabase.from(TABLE).update(upd).eq("id", row.id);
    if (!updErr) { changed++; console.log(`[maintenance] Updated URL → ${norm}`); }
    else console.error("[maintenance] update error:", updErr);
  }
  console.log(`[maintenance] Normalized ${changed} URL(s).`);

  // Re-select for de-dup
  const { data: after, error: afterErr } = await supabase
    .from(TABLE)
    .select(`id,${urlCol},published_at,created_at`)
    .order(orderCol, { ascending: false })
    .limit(400);

  if (afterErr) {
    console.error("reselect error:", afterErr);
    process.exit(1);
  }

  // De-dup by URL (keep newest)
  const byUrl = new Map();
  for (const r of after || []) {
    const key = r[urlCol] || "";
    if (!key) continue;
    const ts = Date.parse(r.published_at || r.created_at || 0) || 0;
    const prev = byUrl.get(key);
    if (!prev || ts > prev.ts || (ts === prev.ts && r.id > prev.id)) {
      byUrl.set(key, { ts, keep: r.id });
    }
  }
  const keepSet = new Set(Array.from(byUrl.values()).map((v) => v.keep));
  const dupes = (after || []).map((r) => r.id).filter((id) => !keepSet.has(id));

  if (dupes.length) {
    const { error: delErr } = await supabase.from(TABLE).delete().in("id", dupes);
    if (delErr) console.error("[maintenance] de-dup delete error:", delErr);
    else console.log(`[maintenance] De-dup removed ${dupes.length} row(s).`);
  } else {
    console.log("[maintenance] De-dup: none to remove.");
  }

  // Prune to newest LIMIT_KEEP
  const { data: keepRows, error: selErr } = await supabase
    .from(TABLE)
    .select("id")
    .order(orderCol, { ascending: false })
    .limit(LIMIT_KEEP);

  if (selErr) {
    console.error("[maintenance] prune select error:", selErr);
    process.exit(1);
  }

  const keepIds = (keepRows || []).map((r) => r.id);
  if (keepIds.length) {
    const { error: delErr2 } = await supabase.from(TABLE).delete().not("id", "in", keepIds);
    if (delErr2) console.error("[maintenance] prune delete error:", delErr2);
    else console.log(`[maintenance] Pruned to newest ${keepIds.length} rows (ordered by ${orderCol}).`);
  } else {
    console.log("[maintenance] Nothing to prune (no rows).");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
