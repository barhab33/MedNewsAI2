/**
 * scripts/maintenance-normalize.cjs
 *
 * Normalizes article URLs and keeps only the newest N rows.
 * - Auto-detects the URL column: tries url → source_url → article_url → link
 * - Converts Google News redirect links to canonical targets
 * - Normalizes/strips tracking params
 * - De-duplicates by URL (keeps newest row)
 * - Prunes table to newest LIMIT rows
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

const TABLE = "medical_news";
const LIMIT_KEEP = 10;

// ---------- helpers ----------
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
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

async function unwrapGoogleNews(url) {
  try {
    if (!isGoogleNewsLink(url)) return url;
    const r = await fetch(url, { redirect: "follow", method: "HEAD" });
    if (r.ok) return normalizeUrl(r.url || url);
  } catch {}
  return normalizeUrl(url);
}

async function columnExists(col) {
  try {
    await supabase.from(TABLE).select("id", { head: true }).order(col, { ascending: false }).limit(1);
    return true;
  } catch (e) {
    if (e?.code === "42703") return false;
    // other errors should bubble
    throw e;
  }
}

async function pickUrlColumn() {
  const candidates = ["url", "source_url", "article_url", "link"];
  for (const c of candidates) {
    if (await columnExists(c)) return c;
  }
  return null;
}

async function pickOrderColumn() {
  const candidates = ["published_at", "created_at", "inserted_at", "date", "id"];
  for (const c of candidates) {
    if (await columnExists(c)) return c;
  }
  return "id";
}

// ---------- main workflow ----------
(async () => {
  const urlCol = await pickUrlColumn();
  const orderCol = await pickOrderColumn();

  if (!urlCol) {
    console.log(`[maintenance] No URL-like column present on ${TABLE}; nothing to normalize. (Tried url, source_url, article_url, link)`);
    // Still prune to newest LIMIT_KEEP by orderCol if we can
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

  // Load recent rows (grab more than LIMIT_KEEP to allow dedupe)
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
    if (!updErr) {
      changed++;
      console.log(`[maintenance] Updated URL → ${norm}`);
    } else {
      console.error("[maintenance] update error:", updErr);
    }
  }
  console.log(`[maintenance] Normalized ${changed} URL(s).`);

  // De-dup by normalized URL (keep newest)
  const { data: after, error: afterErr } = await supabase
    .from(TABLE)
    .select(`id,${urlCol},published_at,created_at`)
    .order(orderCol, { ascending: false })
    .limit(400);

  if (afterErr) {
    console.error("reselect error:", afterErr);
    process.exit(1);
  }

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
