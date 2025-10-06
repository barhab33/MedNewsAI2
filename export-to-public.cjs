/**
 * Export latest items from `medical_news` to /public for your static site.
 * - Uses shared Supabase client (Bolt shim aware).
 * - Writes public/feed.json and a minimal public/index.html (fallback).
 */

const fs = require("fs");
const path = require("path");

// Friendly guard so CI errors are obvious:
const miss = [];
if (!process.env.VITE_BOLTDATABASE_URL && !process.env.VITE_SUPABASE_URL) miss.push("VITE_BOLTDATABASE_URL");
if (!process.env.VITE_BOLTDATABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) miss.push("VITE_BOLTDATABASE_ANON_KEY");
if (miss.length) {
  console.error("Missing database credentials:", miss.join(", "));
  process.exit(1);
}

// NOTE: this file lives at repo root → import from scripts/lib/...
const { sb: supabase } = require("./scripts/lib/supabase-server.cjs");

// Output under the repo's own /public folder (no .. here)
const OUT_DIR = path.join(__di_
