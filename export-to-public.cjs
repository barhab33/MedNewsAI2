// Export using Supabase client - no password needed!
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available
  }
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  try {
    console.log('✓ Connecting to Supabase...');

    const { data, error } = await supabase
      .from('medical_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✓ Found ${data.length} articles`);

    // Ensure public directory exists
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to public/news-data.json
    const filePath = path.join(publicDir, 'news-data.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✓ Exported to ${filePath}`);
    console.log('\n✅ Done! Refresh your browser to see the articles.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportData();
