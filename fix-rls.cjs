const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  await client.connect();
  console.log('✓ Connected');

  await client.query('DROP POLICY IF EXISTS "Anyone can view medical news" ON medical_news');
  await client.query('DROP POLICY IF EXISTS "Service role can insert news" ON medical_news');
  await client.query('DROP POLICY IF EXISTS "Public read access" ON medical_news');
  await client.query('DROP POLICY IF EXISTS "Service can insert" ON medical_news');
  console.log('✓ Dropped old policies');

  await client.query(`
    CREATE POLICY "Enable read for anon and authenticated"
      ON medical_news FOR SELECT
      TO anon, authenticated
      USING (true)
  `);
  console.log('✓ Created public read policy');

  await client.query(`
    CREATE POLICY "Enable insert for service role"
      ON medical_news FOR INSERT
      TO service_role
      WITH CHECK (true)
  `);
  console.log('✓ Created insert policy');

  const test = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log(`✓ Total articles: ${test.rows[0].count}`);

  await client.end();
  console.log('✓ RLS policies fixed!');
}

fix().catch(console.error);