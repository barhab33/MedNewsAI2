// Maps SUPABASE_* lookups to your existing BOLTDATABASE/Bolt Vite names.
function get(name) {
  // direct (preferred)
  if (process.env[name]) return process.env[name];
  if (process.env["VITE_" + name]) return process.env["VITE_" + name];

  // map SUPABASE_* -> BOLTDATABASE_*
  const bolt = name.replace(/^SUPABASE/, "BOLTDATABASE");
  if (process.env[bolt]) return process.env[bolt];
  if (process.env["VITE_" + bolt]) return process.env["VITE_" + bolt];

  // common alternates
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
const SUPABASE_SERVICE_ROLE = get("SUPABASE_SERVICE_ROLE"); // set if you do writes in CI
const SUPABASE_ANON_KEY     = get("SUPABASE_ANON_KEY");     // read-only fallback

module.exports = { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY };
