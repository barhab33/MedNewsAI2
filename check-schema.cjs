const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  await client.connect();

  const result = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'medical_news'
    ORDER BY ordinal_position
  `);

  console.log('Current schema for medical_news table:\n');
  result.rows.forEach(col => {
    console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default || ''}`);
  });

  await client.end();
}

checkSchema().catch(console.error);