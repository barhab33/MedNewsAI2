// Maps SUPABASE_* lookups to your existing BOLTDATABASE / Vite(Bolt) names.
// This lets you keep Bolt-style secret names while code can ask for SUPABASE_*.

function get(name) {
  // 1) Exact name first (server secrets)
  if (process.env[name]) return process.env[name];
  // 2) Vite-prefixed (browser build or step-level envs)
  if (process.env["VITE_" + name]) return process.env["VITE_" + name];

  // 3) Map SUPABASE_* -> BOLTDATABASE_* (both server + Vite variants)
  const bolt = name.replace(/^SUPABASE/, "BOLTDATABASE");
  if (process.env[bolt]) return process.env[bolt];
  if (process.env["VITE_" + bolt]) return process.env["VITE_" + bolt];

  // 4) Common alternates/fallbacks
  if (name === "SUPABASE_URL") {
    return (
      process.env.VITE_BOLTDATABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_PROJECT_URL ||
      null
    );
  }
  if (name === "SUPABASE_ANON_KEY") {
    return (
      process.env.VITE_BOLTDATABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      null
    );
  }
  return null;
}

const SUPABASE_URL          = get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE = get("SUPABASE_SERVICE_ROLE"); // server/CI writes
const SUPABASE_ANON_KEY     = get("SUPABASE_ANON_KEY");     // read-only fallback

module.exports = { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY };
