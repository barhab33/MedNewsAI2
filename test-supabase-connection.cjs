const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhyrfjletazbsjsfosdl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeXJmamxldGF6YnNqc2Zvc2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzA5MTksImV4cCI6MjA1MTI0NjkxOX0.HiDBmS1kI-nzS0IbDFMfVhCVD_aUx_K5SaRPE6exUtM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase connection with anon key...\n');

  try {
    const { data, error } = await supabase
      .from('medical_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log(`✓ Successfully fetched ${data.length} articles`);
    console.log('\nArticles:');
    data.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title.substring(0, 60)}...`);
      console.log(`   Category: ${article.category}`);
      console.log(`   Source: ${article.source}`);
    });

  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

test();