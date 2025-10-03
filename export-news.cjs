const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function exportNews() {
  await client.connect();
  console.log('✓ Connected to database');

  const result = await client.query(
    'SELECT * FROM medical_news ORDER BY published_at DESC'
  );

  const newsData = result.rows;
  console.log(`✓ Fetched ${newsData.length} articles`);

  fs.mkdirSync('public', { recursive: true });

  fs.writeFileSync(
    'public/news-data.json',
    JSON.stringify(newsData, null, 2)
  );

  console.log('✓ Exported to public/news-data.json');

  await client.end();
}

exportNews().catch(console.error);