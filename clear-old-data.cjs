const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function clearOldData() {
  await client.connect();
  console.log('✓ Connected to database\n');

  // Delete PubMed articles
  const result = await client.query(
    "DELETE FROM medical_news WHERE source_url LIKE '%pubmed.ncbi.nlm.nih.gov%'"
  );

  console.log(`✓ Deleted ${result.rowCount} PubMed articles`);

  const remaining = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log(`✓ Remaining articles: ${remaining.rows[0].count}`);

  await client.end();
}

clearOldData().catch(console.error);