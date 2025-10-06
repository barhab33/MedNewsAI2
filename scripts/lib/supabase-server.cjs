// Shared Supabase client for Node/CI scripts (uses the Bolt shim).
const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY } = require("./supa-env.cjs");

if (!SUPABASE_URL) {
  throw new Error("DB config: Missing SUPABASE_URL (shim also reads VITE_BOLTDATABASE_URL).");
}

// Prefer service role for writes; anon key is fine for read-only scripts.
const key = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
if (!key) {
  throw new Error("DB config: Missing SUPABASE_SERVICE_ROLE / SUPABASE_ANON_KEY (shim checks Bolt names).");
}

const sb = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });

module.exports = { sb };
