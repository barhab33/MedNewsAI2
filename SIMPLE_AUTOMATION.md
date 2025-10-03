# Simple Automation Guide

The website is working with Gemini-generated summaries! Here's how to keep it updated automatically:

## Current Setup

- Website reads from `/public/news-data.json` (working perfectly!)
- Crawler uses Gemini AI to generate summaries and content
- Just need to run the crawler regularly to update the JSON file

## How to Update Articles

### Option 1: Manual (Quick & Easy)

Run these two commands whenever you want fresh articles:

```bash
node crawl-multi-ai.cjs
node export-to-public.cjs
```

That's it! Refresh your website to see new articles.

### Option 2: Automatic with Cron (Recommended)

If you have a server or computer that stays on, set up a cron job:

1. Open crontab:
   ```bash
   crontab -e
   ```

2. Add this line to run daily at 8 AM:
   ```bash
   0 8 * * * cd /path/to/your/project && node crawl-multi-ai.cjs && node export-to-public.cjs
   ```

### Option 3: GitHub Actions (Free & Automatic)

If your code is on GitHub:

1. Create `.github/workflows/update-news.yml`:

```yaml
name: Update Medical News
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC
  workflow_dispatch:  # Can also trigger manually

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Crawl news
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: node crawl-multi-ai.cjs

      - name: Export to public
        run: node export-to-public.cjs

      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/news-data.json
          git commit -m "Update news articles" || exit 0
          git push
```

2. Add your `GEMINI_API_KEY` to GitHub Secrets:
   - Go to repository Settings → Secrets → New repository secret
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key

### Option 4: Simple Admin Page

I created `admin-crawler.html` for you:

1. Start the API server:
   ```bash
   node api-server.cjs
   ```

2. Open `admin-crawler.html` in your browser

3. Click "Start Crawling" button

4. Refresh your website to see new articles

## What the Crawler Does

1. Searches Google News for AI medical topics
2. Uses Gemini AI to generate intelligent summaries
3. Saves to Supabase database
4. Exports to `/public/news-data.json`
5. Website automatically shows new articles on next page load

## Tips

- The crawler respects API rate limits (handles 429 errors gracefully)
- Duplicate articles are automatically skipped
- Run it once per day for fresh content
- Each run finds ~40 new articles

## Troubleshooting

If articles aren't showing up:
1. Check that `/public/news-data.json` exists and has data
2. Make sure you ran `export-to-public.cjs` after crawling
3. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
