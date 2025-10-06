const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY } = require("./supa-env.cjs");

if (!SUPABASE_URL) {
  throw new Error("DB config: Missing SUPABASE_URL (Bolt shim will also read VITE_BOLTDATABASE_URL).");
}

// Prefer service role for scripts that write; fall back to anon for read-only scripts.
const key = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
if (!key) {
  throw new Error("DB config: Missing SUPABASE_SERVICE_ROLE / SUPABASE_ANON_KEY (shim also checks Bolt names).");
}

const sb = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
module.exports = { sb };
