/**
 * Crawl → rank → take top 10 *new* URLs → summarize (Gemini) → image → upsert → prune to 10 newest
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

// ------------------ Config ------------------
// Google News with recency filter (past 24h). Add/remove as you like.
const GN = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:1d")}&hl=en-US&gl=US&ceid=US:en`;

const FEEDS = [
  GN("(medical AI) OR (health AI)"),
  GN("(clinical AI) OR (biomedical AI)"),
  GN("radiology AI OR imaging AI"),
  GN("FDA AI medical device OR \"machine learning\" device"),
  GN("oncology AI OR cancer AI"),
  // Publisher feeds (some are journals/newsrooms)
  "https://www.nature.com/subjects/medical-ai/rss",
  "https://www.nature.com/subjects/health-informatics/rss",
  "https://www.medrxiv.org/rss.xml",
  // A few sites (their RSS):
  "https://www.fiercebiotech.com/rss/xml",
  "https://www.fiercepharma.com/rss/xml",
  "https://www.statnews.com/feed/"
];

const MAX_ITEMS_PER_FEED = 25;
const MAX_CANDIDATES = 120;
const TAKE_TOP = 10;
const ORDER_CANDIDATES = ["published_at", "created_at", "inserted_at", "date", "id"];

const GEMINI_MODEL = "models/gemini-1.5-flash";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const PEXELS_KEY = process.env.PEXELS_API_KEY || "";

// ------------------ Helpers ------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

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
    return u.toString();
  } catch {
    return raw;
  }
}

const isGoogleNewsLink = (u) => /^https?:\/\/news\.g
