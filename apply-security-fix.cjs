#!/usr/bin/env node
require('dotenv').config();
const https = require('https');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE key is required in .env file');
  process.exit(1);
}

console.log('🔒 Applying security policy fixes...\n');

// Create the SQL migration
const sqlStatements = [
  'DROP POLICY IF EXISTS "Anyone can view medical news" ON medical_news;',
  'DROP POLICY IF EXISTS "Service role can insert news" ON medical_news;',
  'DROP POLICY IF EXISTS "Service role can update news" ON medical_news;',

  `CREATE POLICY "Public read access to news"
    ON medical_news
    FOR SELECT
    TO public
    USING (true);`,

  `CREATE POLICY "Service role can insert news"
    ON medical_news
    FOR INSERT
    TO service_role
    WITH CHECK (true);`,

  `CREATE POLICY "Service role can update news"
    ON medical_news
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);`,

  `CREATE POLICY "Service role can delete news"
    ON medical_news
    FOR DELETE
    TO service_role
    USING (true);`
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);

    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseData });
        } else {
          resolve({ success: false, status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function fixSecurity() {
  try {
    const fullSQL = sqlStatements.join('\n\n');
    console.log('Executing SQL migration...\n');

    const result = await executeSQL(fullSQL);

    if (result.success) {
      console.log('✅ Security policies have been updated successfully!');
      console.log('\nThe database is now secure:');
      console.log('  ✓ Public users can READ articles');
      console.log('  ✓ Only service role can INSERT/UPDATE/DELETE');
      console.log('\nThe Supabase security warning should disappear.');
    } else {
      console.log('⚠️  API method not available. Manual fix required.\n');
      console.log('Please go to your Supabase Dashboard:');
      console.log(`https://supabase.com/dashboard/project/qhyrfjletazbsjsfosdl/editor\n`);
      console.log('Then run this SQL in the SQL Editor:\n');
      console.log(fullSQL);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease apply the fix manually in Supabase Dashboard.');
  }
}

fixSecurity();
