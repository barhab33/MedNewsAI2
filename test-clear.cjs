require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY
);

async function clearArticles() {
  console.log('Clearing articles for fresh test...');
  
  const { error } = await supabase
    .from('medical_news')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✓ All articles cleared');
  }
}

clearArticles();
