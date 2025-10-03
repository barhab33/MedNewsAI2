const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function disableRLS() {
  await client.connect();
  console.log('✓ Connected');

  await client.query('ALTER TABLE medical_news DISABLE ROW LEVEL SECURITY');
  console.log('✓ Disabled RLS on medical_news table');

  await client.query('GRANT SELECT ON medical_news TO anon');
  await client.query('GRANT SELECT ON medical_news TO authenticated');
  console.log('✓ Granted SELECT permissions to anon and authenticated roles');

  const test = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log(`✓ Total articles: ${test.rows[0].count}`);

  await client.end();
  console.log('✓ Done! Table is now publicly readable.');
}

disableRLS().catch(console.error);