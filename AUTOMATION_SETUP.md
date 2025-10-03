# Fully Automated Medical AI News Site

YES! Your site CAN update automatically without manual input. Here's how:

## How It Works

1. **Supabase Edge Functions** crawl news and use Gemini AI to generate content
2. **Database** stores all articles automatically
3. **Frontend** fetches live data from Supabase (not static JSON)
4. **Scheduled triggers** run the crawler every 2 hours

## What's Already Set Up

### Edge Functions (Deployed)

- `crawl-google-news` - Crawls Google News with Gemini AI summaries
- `crawl-medical-news` - Crawls PubMed research articles
- `get-news` - API to fetch articles

### Database

- `medical_news` table with all articles
- Public read access (anyone can view)
- Service role insert/update (only edge functions)

### Frontend

- Fetches from Supabase automatically
- Falls back to static JSON if needed
- Shows new articles immediately

## Make It 100% Automatic

### Option 1: GitHub Actions (FREE - Recommended)

Create `.github/workflows/crawl-news.yml`:

```yaml
name: Auto Crawl Medical News

on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:  # Manual trigger button

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger News Crawler
        run: |
          curl -X POST \
            https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/crawl-google-news \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

Add `SUPABASE_ANON_KEY` as a GitHub secret.

### Option 2: Cron-Job.org (FREE - No Code)

1. Sign up at https://cron-job.org (free)
2. Create new cron job
3. URL: `https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/crawl-google-news`
4. Schedule: Every 2 hours
5. Done! Site updates automatically

### Option 3: Vercel Cron (If deployed to Vercel)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron-crawl",
    "schedule": "0 */2 * * *"
  }]
}
```

Create `/api/cron-crawl.ts`:

```typescript
export default async function handler() {
  await fetch(
    'https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/crawl-google-news',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      }
    }
  );

  return Response.json({ success: true });
}
```

### Option 4: Supabase pg_cron (Advanced)

Run in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'crawl-news-every-2-hours',
  '0 */2 * * *',
  $$
    SELECT net.http_post(
      url := 'https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/crawl-google-news',
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

## Environment Variables

In Supabase Dashboard, add to Edge Functions secrets:

- `GEMINI_API_KEY` - Get free from https://makersuite.google.com/app/apikey

(SUPABASE_URL and SERVICE_ROLE_KEY are automatic)

## Test It Now

Trigger manually to verify:

```bash
curl -X POST https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/crawl-google-news
```

Response should show:
```json
{
  "success": true,
  "message": "Successfully crawled and stored 35 articles",
  "total_found": 40,
  "inserted": 35
}
```

## The Complete Automatic Flow

```
Cron Job (Every 2 hours)
    ↓
Calls Supabase Edge Function
    ↓
Crawls Google News RSS Feeds
    ↓
Gemini AI generates summaries & content
    ↓
Saves to medical_news table (deduped)
    ↓
Frontend fetches from database
    ↓
Users see fresh articles automatically!
```

## What Gets Crawled

- 8 different medical AI search queries
- ~40 articles per crawl
- Gemini generates unique summaries and expanded content
- Categories: Diagnostics, Surgery, Drug Discovery, Imaging, Research, etc.
- Duplicate URLs are automatically skipped

## Cost Analysis

- **Supabase**: Free tier (500MB, edge functions included)
- **Gemini API**: Free tier (15 req/min, 1500/day)
- **GitHub Actions**: Free (2000 min/month)
- **Cron-job.org**: Free
- **Storage**: ~1MB per 100 articles

**Total: $0/month** for typical usage!

## Monitoring

### Supabase Dashboard

1. Go to Edge Functions
2. Click `crawl-google-news`
3. View Logs tab
4. See real-time crawl activity

### Check Article Count

```bash
# See how many articles you have
curl https://0ec90b57d6e95fcbda19832f.supabase.co/rest/v1/medical_news?select=count \
  -H "apikey: YOUR_ANON_KEY"
```

## Troubleshooting

**No articles appearing?**
- Check Supabase Edge Function logs
- Verify Gemini API key is set in Supabase secrets
- Test manual trigger with curl command

**Duplicate articles?**
- The function automatically deduplicates by URL
- Database constraint prevents duplicates

**Rate limited?**
- Gemini free tier: 1500 requests/day
- Edge function has built-in delays (500ms between requests)
- Running every 2 hours = 12 crawls/day = ~480 AI requests/day

## Summary

**YES, it's fully automatic!**

1. Pick a scheduling method (GitHub Actions recommended)
2. Add your Gemini API key to Supabase
3. Set up the cron job
4. **Done!** Your site updates forever without your input

Articles are crawled every 2 hours, processed with AI, stored in the database, and displayed on the website automatically. You never need to touch it again.
