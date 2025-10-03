// Only load dotenv if not in CI and the module exists
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available or not needed
  }
}

function getDbConfig() {
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

  if (!password) {
    console.error('CI:', process.env.CI);
    console.error('GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
    console.error('All SUPABASE/DB env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('DB')));
    throw new Error('Database password not found. Please set SUPABASE_DB_PASSWORD environment variable.');
  }

  return {
    host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  };
}

module.exports = { getDbConfig };
