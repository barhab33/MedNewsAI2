/**
 * scripts/crawl-multi-source.cjs
 *
 * Crawl → rank → ALWAYS take top 10 fresh from last 24h → summarize (Gemini) → image → write
 * Then: de-dup by URL in DB and prune to newest 10.
 *
 * Designed to replace the oldest with the newest every run.
 */

const { sb: supabase } = require("./lib/supabase-server.cjs");

// ------------------ Config ------------------
const GN = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:1d")}&hl=en-US&gl=US&ceid=US:en`;

const FEEDS = [
  GN("(medical AI) OR (health AI)"),
  GN("(clinical AI) OR (biomedical AI)"),
  GN("radiology AI OR imaging AI"),
  GN("oncology AI OR cancer AI"),
  GN("FDA AI medical device OR \"machine learning\" device"),
  "https://www.nature.com/subjects/medical-ai/rss",
  "https://www.nature.com/subjects/health-informatics/rss",
  "https://www.medrxiv.org/rss.xml",
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
const PEXELS_KEY = process.env.PEXELS_API_KEY || "";_
