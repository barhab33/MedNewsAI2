// Browser client for your site; stays read-only with anon key.
import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_BOLTDATABASE_URL;

const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_BOLTDATABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error("Missing VITE_SUPABASE_URL/ANON_KEY (or VITE_BOLTDATABASE_*).");
}

export const sb = createClient(url, anon, { auth: { persistSession: false } });
