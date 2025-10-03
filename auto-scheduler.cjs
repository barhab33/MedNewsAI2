const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

async function callEdgeFunction(functionName) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runScheduledUpdate() {
  console.log('\n=== AUTOMATED NEWS UPDATE ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('==============================\n');

  try {
    console.log('Step 1/3: Fetching news from RSS feeds...');
    const fetchResult = await callEdgeFunction('fetch-news');
    console.log(`✓ Fetched ${fetchResult.inserted || 0} new articles`);
    console.log(`  Found ${fetchResult.total_found || 0} total, ${fetchResult.queued_for_processing || 0} queued for processing\n`);

    if (fetchResult.inserted > 0) {
      console.log('Waiting 3 seconds before processing...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Step 2/3: Processing articles with AI...');
      const processResult = await callEdgeFunction('process-articles');
      console.log(`✓ Processed ${processResult.processed || 0} articles`);
      console.log(`  Generated ${processResult.summaries_generated || 0} AI summaries\n`);
    } else {
      console.log('No new articles to process\n');
    }

    console.log('Step 3/3: Verifying database...');
    const { Client } = require('pg');
    const client = new Client({
      host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
      port: 5432,
      user: 'postgres',
      password: '8ZKt+2D2_2s4fyE',
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const { rows: stats } = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
        COUNT(*) FILTER (WHERE processing_status = 'pending') as pending
      FROM medical_news
    `);

    await client.end();

    console.log(`✓ Database status:`);
    console.log(`  Total articles: ${stats[0].total}`);
    console.log(`  Completed: ${stats[0].completed}`);
    console.log(`  Pending: ${stats[0].pending}\n`);

    console.log('==============================');
    console.log('✓ UPDATE COMPLETED SUCCESSFULLY');
    console.log('==============================\n');

    console.log(`Next update in 5 hours at: ${new Date(Date.now() + 5 * 60 * 60 * 1000).toLocaleString()}\n`);

  } catch (error) {
    console.error('\n✗ UPDATE FAILED');
    console.error('Error:', error.message);
    console.error('==============================\n');
    process.exit(1);
  }
}

runScheduledUpdate();
