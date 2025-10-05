// Explicitly skip dotenv in CI - it should never run in GitHub Actions
if (process.env.CI || process.env.GITHUB_ACTIONS) {
  console.log('Running in CI, skipping dotenv');
} else {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available or not needed
  }
}

function getDbConfig() {
  const password = process.env.BOLTDATABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

  console.log('Debug - Password type:', typeof password);
  console.log('Debug - Password undefined?:', password === undefined);
  console.log('Debug - Password empty string?:', password === '');
  console.log('Debug - Password length:', password ? password.length : 'N/A');
  console.log('Debug - Password truthy?:', !!password);

  if (!password || (typeof password === 'string' && password.trim() === '')) {
    console.error('CI:', process.env.CI);
    console.error('GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
    console.error('All SUPABASE/DB env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('DB') || k.includes('BOLTDATABASE')));
    throw new Error('Database password not found or empty. Please check BOLTDATABASE_DB_PASSWORD in GitHub Secrets.');
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
