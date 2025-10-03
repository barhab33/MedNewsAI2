const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Source: Old database with articles
const sourceClient = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Destination: Working Supabase instance
const supabaseUrl = 'https://qhyrfjletazbsjsfosdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeXJmamxldGF6YnNqc2Zvc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY3MDkxOSwiZXhwIjoyMDUxMjQ2OTE5fQ.S_Ox82u2ZHuixXdnVkR6BDKlNQCmNdI7Fy7xO-VT5OI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🔄 Starting data migration...\n');

  try {
    // Connect to source database
    await sourceClient.connect();
    console.log('✓ Connected to source database');

    // Get all articles
    const result = await sourceClient.query('SELECT * FROM medical_news ORDER BY published_at DESC');
    console.log(`✓ Found ${result.rows.length} articles to migrate\n`);

    // Clear destination table
    console.log('🗑️  Clearing destination table...');
    const { error: deleteError } = await supabase
      .from('medical_news')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
      console.log('Warning:', deleteError.message);
    }

    // Insert articles in batches
    console.log('📝 Inserting articles...\n');
    let inserted = 0;
    let failed = 0;

    for (const article of result.rows) {
      const { error: insertError } = await supabase
        .from('medical_news')
        .insert({
          title: article.title,
          summary: article.summary,
          content: article.content,
          source: article.source,
          source_url: article.source_url,
          original_source: article.original_source,
          category: article.category,
          published_at: article.published_at,
          image_url: article.image_url
        });

      if (insertError) {
        console.log(`  ❌ Failed: ${article.title.substring(0, 50)}... - ${insertError.message}`);
        failed++;
      } else {
        console.log(`  ✓ [${article.category}] ${article.title.substring(0, 60)}...`);
        inserted++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Failed: ${failed}`);

    // Verify
    const { count, error: countError } = await supabase
      .from('medical_news')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📊 Total articles in Supabase: ${count}`);
    }

    await sourceClient.end();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
