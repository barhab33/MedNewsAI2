const http = require('http');
const { spawn } = require('child_process');
const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(() => console.log('✓ Connected to database'));

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ready', message: 'Crawler API is running' }));
    return;
  }

  if (req.url === '/crawl' && req.method === 'POST') {
    try {
      console.log('\n🚀 Starting crawler...');

      const crawler = spawn('node', ['crawl-multi-ai.cjs'], {
        stdio: 'inherit'
      });

      await new Promise((resolve, reject) => {
        crawler.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Crawler exited with code ${code}`));
          }
        });
        crawler.on('error', reject);
      });

      const result = await client.query('SELECT COUNT(*) FROM medical_news');
      const totalArticles = parseInt(result.rows[0].count);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Crawler completed successfully',
        total_in_db: totalArticles
      }));
    } catch (error) {
      console.error('Crawler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.url === '/api/news' && req.method === 'GET') {
    try {
      const result = await client.query(
        'SELECT * FROM medical_news ORDER BY published_at DESC LIMIT 50'
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Crawler API server running on http://localhost:${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`🔄 Crawl: POST http://localhost:${PORT}/crawl`);
  console.log(`📰 News: http://localhost:${PORT}/api/news`);
  console.log(`\n💡 Open admin-crawler.html in your browser to use the UI\n`);
});
