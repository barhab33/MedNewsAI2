# Medical AI News - Setup Guide

A clean, simple pipeline for crawling, summarizing, and displaying medical AI news.

## Architecture

This project uses a straightforward architecture:

1. **Database**: Supabase (PostgreSQL) stores all articles
2. **Crawler**: Single Node.js script (`crawler.cjs`) that:
   - Crawls medical AI sources (Nature Medicine, Google News, etc.)
   - Selects top 15 highest-quality articles
   - Summarizes with Google Gemini AI
   - Extracts images from articles or uses stock photos
   - Saves to Supabase
3. **Frontend**: React + TypeScript displays articles from Supabase
4. **Automation**: GitHub Actions runs crawler every 6 hours

## Required Secrets

Set these in your GitHub repository settings (Settings → Secrets → Actions):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE` - Your Supabase service role key (for write operations)
- `GEMINI_API_KEY` - Your Google Gemini API key

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key
GEMINI_API_KEY=your_gemini_key
```

3. Run the crawler manually:
```bash
node crawler.cjs
```

4. Start the dev server:
```bash
npm run dev
```

## Automated Updates

The GitHub Action workflow (`.github/workflows/crawler.yml`) runs automatically:
- Every 6 hours
- Or manually via "Actions" tab → "Medical AI News Crawler" → "Run workflow"

## Files Overview

**Core Files:**
- `crawler.cjs` - Main crawler script (does everything)
- `.github/workflows/crawler.yml` - Automation workflow
- `src/components/NewsFeed.tsx` - Main article display
- `src/components/RecentSpotlight.tsx` - Recent articles
- `src/components/BreakingNewsTicker.tsx` - Ticker banner

**Database:**
- `supabase/migrations/20250101000000_create_medical_news_table.sql` - Database schema

## How It Works

1. Crawler fetches articles from:
   - Nature Medicine RSS feed
   - Google News (medical AI search)
   - MIT Technology Review
   - Stanford HAI
   - And more quality sources

2. Articles are ranked by:
   - Source priority (high for Nature, NEJM, etc.)
   - Recency (newer articles get bonus points)

3. Top 15 articles are:
   - Summarized with Gemini AI (to avoid copyright issues)
   - Categorized automatically (Diagnostics, Surgery, Drug Discovery, etc.)
   - Enhanced with images from original articles or stock photos

4. Frontend loads articles from Supabase in real-time

## Troubleshooting

**Crawler fails with "Could not find column":**
- Make sure the Supabase migration has been applied
- Run `node ensure-schema.cjs` to verify schema

**No articles showing on website:**
- Check Supabase database has articles
- Check browser console for errors
- Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**GitHub Action fails:**
- Verify all secrets are set correctly
- Check Action logs for specific error messages
- Ensure `SUPABASE_SERVICE_ROLE` secret exists (not just `SUPABASE_ANON_KEY`)
