require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ensureSchema() {
  console.log('Checking database schema...');

  const { data, error } = await supabase
    .from('medical_news')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error checking schema:', error.message);
    console.log('\nThe medical_news table may not exist or have the correct schema.');
    console.log('Please ensure the migration file has been applied to your Supabase database.');
    process.exit(1);
  }

  console.log('✓ Database schema looks good!');

  if (data && data.length > 0) {
    console.log(`Found ${data.length} existing article(s)`);
    console.log('Sample:', data[0]);
  } else {
    console.log('Table is empty - ready for crawler to populate');
  }
}

ensureSchema();
