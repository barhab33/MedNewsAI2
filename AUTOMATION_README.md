# Automated News Updates - Setup Guide

This system automatically fetches and processes medical AI news every 5 hours without any manual intervention.

## How It Works

1. **Fetch** - Pulls latest articles from Google News RSS feeds
2. **Process** - Generates summaries using multiple AI models (Gemini, Groq, Grok)
3. **Publish** - Articles automatically appear on your website

## Setup Options

### Option 1: Using Cron (Linux/Mac)

1. Open your crontab:
```bash
crontab -e
```

2. Add this line (runs every 5 hours):
```
0 */5 * * * cd /path/to/your/project && node auto-scheduler.cjs >> logs/scheduler.log 2>&1
```

3. Create logs directory:
```bash
mkdir -p logs
```

### Option 2: Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create a new task:
   - **Trigger**: Repeat every 5 hours
   - **Action**: Start a program
   - **Program**: `node`
   - **Arguments**: `auto-scheduler.cjs`
   - **Start in**: Path to your project folder

### Option 3: Using PM2 (Recommended for Production)

1. Install PM2:
```bash
npm install -g pm2
```

2. Create PM2 config file `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'news-scheduler',
    script: './auto-scheduler.cjs',
    cron_restart: '0 */5 * * *',
    autorestart: false,
    watch: false
  }]
};
```

3. Start the scheduler:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 4: Using GitHub Actions (Cloud-Based)

1. Create `.github/workflows/scheduler.yml`:
```yaml
name: News Update Scheduler

on:
  schedule:
    - cron: '0 */5 * * *'  # Every 5 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run news update
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: node auto-scheduler.cjs
```

2. Add secrets to your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Manual Testing

Run this to test the automation immediately:
```bash
node auto-scheduler.cjs
```

## Required Environment Variables

Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## AI Provider Setup (Optional)

To enable multi-LLM processing, add API keys to your Supabase Edge Function secrets:

### Google Gemini
```bash
# Get key from: https://makersuite.google.com/app/apikey
supabase secrets set GEMINI_API_KEY=your_key_here
```

### Groq
```bash
# Get key from: https://console.groq.com/keys
supabase secrets set GROQ_API_KEY=your_key_here
```

### xAI Grok
```bash
# Get key from: https://console.x.ai/
supabase secrets set XAI_API_KEY=your_key_here
```

**Note:** The system works with any number of providers. If no API keys are configured, it uses the default fallback summarization.

## Monitoring

View logs to ensure automation is working:

**Cron logs:**
```bash
tail -f logs/scheduler.log
```

**PM2 logs:**
```bash
pm2 logs news-scheduler
```

**Manual check:**
```bash
node auto-scheduler.cjs
```

## Admin Dashboard

Access the admin dashboard to manually trigger updates or view statistics:
- Local: `http://localhost:5173/admin.html`
- Production: `https://yourdomain.com/admin.html`

## Troubleshooting

### Scheduler not running
- Check cron syntax is correct
- Verify Node.js path: `which node`
- Check logs for errors

### No new articles
- RSS feeds might be rate-limited
- Check network connectivity
- Verify Supabase credentials

### AI processing failing
- Verify API keys are set correctly
- Check API quotas/limits
- Review error logs in admin dashboard

## Support

For issues or questions, check:
1. System logs
2. Admin dashboard statistics
3. Supabase Edge Function logs
