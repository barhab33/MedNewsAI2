const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkArticles() {
  await client.connect();

  const result = await client.query(
    'SELECT title, original_source, summary, content FROM medical_news ORDER BY published_at DESC LIMIT 5'
  );

  console.log('\nRecent articles:\n');
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.title.substring(0, 70)}...`);
    console.log(`   Source: ${row.original_source}`);
    console.log(`   Summary: ${row.summary.substring(0, 100)}...`);
    console.log(`   Content: ${row.content.substring(0, 150)}...`);
    console.log('');
  });

  await client.end();
}

checkArticles().catch(console.error);