# MedNewsAI - Setup Instructions

## Quick Setup Guide

Your Supabase database is configured, but you need to create the database table and run the initial crawl.

### Step 1: Create Database Table

1. Go to your Supabase dashboard: https://0ec90b57d6e95fcbda19832f.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/20250101000000_create_medical_news_table.sql`
5. Click **Run** to execute the migration

This will create:
- The `medical_news` table with all necessary columns
- Indexes for fast querying
- Row Level Security policies (public read access)
- Automatic timestamp triggers

### Step 2: Deploy the News Crawler Edge Function

The crawler function is already created at `supabase/functions/crawl-medical-news/index.ts`

**Option A: Deploy via Supabase Dashboard**
1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Deploy new function**
3. Upload the files from `supabase/functions/crawl-medical-news/`
4. Deploy with name: `crawl-medical-news`

**Option B: Manual Test (Recommended First)**
Once the table is created, you can manually trigger a crawl using the test script:
```bash
./scripts/test-crawler.sh
```

This will:
- Crawl Google News for medical AI breakthroughs
- Parse and categorize articles
- Calculate impact scores
- Store real news in your database

### Step 3: Verify Site Works

After running the crawler, refresh your site. You should see real medical AI news articles appear!

### Step 4: Set Up Hourly Automated Crawling

**Option A: Using GitHub Actions (Recommended)**
1. Go to your GitHub repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Add two secrets:
   - `SUPABASE_URL`: `https://0ec90b57d6e95fcbda19832f.supabase.co`
   - `SUPABASE_ANON_KEY`: Your anon key from `.env`
4. The workflow in `.github/workflows/crawl-news.yml` will run automatically every hour

**Option B: Using a Cron Service**
Set up a cron job to call your edge function hourly:
```bash
curl -X POST "https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/crawl-medical-news" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Option C: Using Supabase Cron (If Available)**
In Supabase dashboard, set up a cron job to call the edge function every hour.

## Troubleshooting

### "Database connection not configured"
- Check that `.env` file has correct Supabase credentials
- Restart your dev server after updating `.env`

### "No articles available yet"
- Run the migration SQL first (Step 1)
- Run the crawler (Step 2)
- Check Supabase dashboard → Table Editor → medical_news to see if data exists

### Crawler not working
- Check Edge Function logs in Supabase dashboard
- Verify the function is deployed correctly
- Try running `./scripts/test-crawler.sh` locally

## Architecture Overview

### News Sources
- Google News RSS feeds
- Searches 10 medical AI keywords every hour
- Auto-categorizes into 8 medical categories
- Deduplicates by source URL

### Categories
1. Diagnostics
2. Surgery
3. Drug Discovery
4. Medical Imaging
5. Genomics
6. Patient Care
7. Clinical Trials
8. Telemedicine

### Impact Scoring (0-100)
- Base: 70 points
- High-impact keywords: +8 each (breakthrough, revolutionary, etc.)
- Medium-impact keywords: +4 each (significant, important, etc.)
- Prestigious sources: +10 (Nature, Science, Lancet, etc.)

## Next Steps

1. ✅ Run the SQL migration
2. ✅ Test the crawler manually
3. ✅ Verify news appears on site
4. ⏰ Set up hourly automation
5. 📊 Monitor crawler performance

For detailed technical documentation, see `CRAWLING_SETUP.md`.