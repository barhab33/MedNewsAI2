# GitHub Workflow Status & Fixes

## Issues Fixed

### 1. Article Content Display
- **Problem**: Articles were showing HTML-encoded content instead of readable text
- **Fix**: Added HTML entity decoding and tag stripping to the crawler
- **Location**: `scripts/crawl-multi-source.cjs`

### 2. Content Extraction
- **Problem**: Without GEMINI_API_KEY, articles only had short descriptions
- **Fix**: Added content extraction from source URLs with proper Google News URL unwrapping
- **Location**: `scripts/crawl-multi-source.cjs` - functions `extractArticleContent()` and `unwrapGoogleNews()`

### 3. Workflow File Updates
- **Problem**: `update-news.yml` workflow had incorrect crawler detection logic
- **Fix**: Simplified to directly call `scripts/crawl-multi-source.cjs`
- **Location**: `.github/workflows/update-news.yml`

## Current Workflow Configuration

### Environment Variables Required (GitHub Secrets)

The following secrets must be configured in your GitHub repository:

1. **Database Connection** (Required):
   - `VITE_BOLTDATABASE_URL` - Your Supabase project URL
   - `VITE_BOLTDATABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE` - Your Supabase service role key (for write operations)

2. **AI Services** (Recommended):
   - `GEMINI_API_KEY` - Google Gemini API for article summarization
   - `PEXELS_API_KEY` - Pexels API for article images
   - `GOOGLE_API_KEY` - (Optional) Additional Google services
   - `OPENAI_API_KEY` - (Optional) OpenAI services
   - `ANTHROPIC_API_KEY` - (Optional) Anthropic services

### Workflow Behavior

**update-news.yml** (Automated):
- Runs every 8 hours via cron: `0 */8 * * *`
- Can be manually triggered from GitHub Actions tab
- Steps:
  1. Checkout repository
  2. Install Node.js 20 and dependencies
  3. Run `scripts/crawl-multi-source.cjs` to fetch latest articles
  4. Run `scripts/maintenance-normalize.cjs` if present
  5. Run `scripts/export-to-public.cjs` to generate public feed
  6. Commit and push changes back to repository

**manual-update.yml**:
- Manual trigger only
- Uses `scripts/crawl-supabase.cjs` (different crawler)

## Testing the Workflow

To test if your workflow will succeed:

1. **Verify GitHub Secrets are set**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Ensure all required secrets are configured

2. **Manually trigger the workflow**:
   - Go to Actions tab
   - Select "update-news" workflow
   - Click "Run workflow"

3. **Check the logs**:
   - Monitor each step for errors
   - The crawler should fetch ~10 articles
   - Export should create `public/feed.json`
   - Commit should push changes

## Expected Output

When the workflow runs successfully with GEMINI_API_KEY:
- Articles will have full AI-generated summaries (200-500 words)
- Content will be well-structured and informative
- Images will be sourced from Pexels or article OG tags

Without GEMINI_API_KEY:
- Articles will have shorter content extracted from source pages
- Quality depends on source website structure
- Still functional but less comprehensive

## Notes

- The `supa-env.cjs` helper automatically maps between `VITE_BOLTDATABASE_*` and `VITE_SUPABASE_*` environment variable names
- Local testing requires adding API keys to `.env` file
- The workflow includes `[skip ci]` in commit messages to prevent infinite loops
