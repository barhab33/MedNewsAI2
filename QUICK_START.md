# Quick Start - Automated Medical AI News Website

Your website is now fully automated and will update itself every 5 hours with zero manual work required!

## What's Already Working

✅ News fetching from Google News RSS feeds
✅ Automatic article processing and summarization
✅ Multi-LLM support (Gemini, Groq, Grok) - optional
✅ Database with article tracking
✅ Admin dashboard for monitoring
✅ Public website displaying latest news

## Setup Automation (Choose One Method)

### Method 1: Cron Job (Linux/Mac) - RECOMMENDED

1. Create logs directory:
```bash
mkdir -p logs
```

2. Get your project path:
```bash
pwd
```

3. Add to crontab:
```bash
crontab -e
```

4. Add this line (replace `/path/to/project` with your actual path):
```
0 */5 * * * cd /path/to/project && node run-update.cjs >> logs/updates.log 2>&1
```

5. Save and exit. Done! Your site will update every 5 hours automatically.

### Method 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Medical AI News Update"
4. Trigger: Daily, repeat every 5 hours
5. Action: Start a program
   - Program: `node`
   - Arguments: `run-update.cjs`
   - Start in: (your project folder path)
6. Finish

### Method 3: PM2 (Production Server)

```bash
npm install -g pm2
pm2 start run-update.cjs --cron "0 */5 * * *" --no-autorestart
pm2 save
pm2 startup
```

## Manual Testing

Test the automation anytime:
```bash
node run-update.cjs
```

## Access Your Website

- **Public Site**: `http://localhost:5173` (or your domain)
- **Admin Dashboard**: `http://localhost:5173/admin.html`

## Admin Dashboard Features

The admin dashboard (`/admin.html`) lets you:
- View statistics (total articles, pending, processed)
- Manually trigger news fetch
- Manually trigger AI processing
- Run full pipeline on-demand
- Monitor recent articles and their status

## How It Works

Every 5 hours, the system automatically:

1. **Fetches** - Pulls up to 20 latest medical AI news articles from Google News RSS (10 different search queries, 2 articles each)
2. **Processes** - Generates summaries and content for up to 20 articles
3. **Publishes** - Articles appear on your website immediately

No manual intervention needed!

## Monitoring

### View Logs
```bash
tail -f logs/updates.log
```

### Check Cron Status
```bash
crontab -l
```

### Database Check
```bash
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
(async () => {
  await client.connect();
  const { rows } = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log('Total articles:', rows[0].count);
  await client.end();
})();
"
```

## Optional: Enable AI Processing (Multi-LLM)

The system works with fallback summaries by default. To enable advanced AI processing:

### Add API Keys (Optional)

1. **Google Gemini** (Free tier available)
   - Get key: https://makersuite.google.com/app/apikey
   - Add to `.env`: `GEMINI_API_KEY=your_key`

2. **Groq** (Free tier available)
   - Get key: https://console.groq.com/keys
   - Add to `.env`: `GROQ_API_KEY=your_key`

3. **xAI Grok**
   - Get key: https://console.x.ai/
   - Add to `.env`: `XAI_API_KEY=your_key`

**Note:** The system works perfectly without these keys using built-in summarization!

## Troubleshooting

### No new articles appearing?
- RSS feeds might be rate-limited (this is normal)
- Articles are deduplicated (won't fetch duplicates)
- Check logs: `tail -f logs/updates.log`

### Cron not running?
- Check cron syntax: `crontab -l`
- Verify node path: `which node` (use full path in crontab)
- Check system time/timezone

### Website not updating?
- Clear browser cache
- Check database: articles should have `processing_status = 'completed'`
- Verify Supabase connection in admin dashboard

## File Structure

```
project/
├── run-update.cjs          # Main automation script
├── admin.html              # Admin dashboard
├── index.html              # Public website
├── logs/                   # Automation logs
├── src/                    # React components
└── supabase/              # Database migrations & functions
```

## Support

Check these resources:
1. Admin dashboard - Real-time statistics
2. `logs/updates.log` - Automation logs
3. Browser console - Frontend errors
4. Database query - Article counts

---

**That's it!** Your website is now fully automated. Sit back and let it run itself! 🚀
