# Medical AI News Crawling System

## Overview

MedNewsAI automatically crawls the internet for real medical AI breakthroughs and healthcare innovations. The system searches Google News hourly and stores articles in Supabase.

## Architecture

### 1. Database Schema (Supabase)
The `medical_news` table stores all crawled articles with:
- Real-time news content
- Impact scoring (0-100)
- Automatic categorization into 8 medical AI categories
- Source attribution and URLs
- Published timestamps

### 2. News Crawler (Edge Function)
**Location**: `supabase/functions/crawl-medical-news/`

**Features**:
- Crawls Google News RSS feeds
- Searches 10 medical AI-specific keywords
- Parses and cleans RSS data
- Auto-categorizes articles
- Calculates impact scores
- Removes duplicates
- Stores in database

**Search Keywords**:
- Medical AI breakthrough
- Healthcare artificial intelligence
- AI diagnosis
- Machine learning medicine
- AI drug discovery
- Medical imaging AI
- AI surgery
- Clinical AI
- Genomics AI
- Telemedicine AI

**Categories**:
1. Diagnostics
2. Surgery
3. Drug Discovery
4. Medical Imaging
5. Genomics
6. Patient Care
7. Clinical Trials
8. Telemedicine

### 3. Frontend Integration
The NewsFeed component:
- Fetches real news from Supabase
- Auto-refreshes on page load
- Supports manual refresh
- Filters by category
- Shows loading states
- Displays impact scores

## Setup Instructions

### Step 1: Database Migration
The database schema needs to be applied. Run the migration:

\`\`\`sql
-- See the migration SQL in the documentation above
-- This creates the medical_news table with proper RLS policies
\`\`\`

### Step 2: Deploy Crawler Edge Function
Deploy the crawler to Supabase:

\`\`\`bash
# The function will be deployed automatically
# Or manually trigger deployment through Supabase dashboard
\`\`\`

### Step 3: Manual Crawl
Trigger a manual crawl to populate initial data:

\`\`\`bash
# Call the edge function endpoint
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/crawl-medical-news \\
  -H "Authorization: Bearer YOUR_ANON_KEY"
\`\`\`

### Step 4: Schedule Hourly Crawls
Set up a cron job or use a service like:
- **Supabase Cron** (recommended)
- **GitHub Actions**
- **Vercel Cron**
- **External cron service**

Example cron configuration (hourly):
\`\`\`
0 * * * * curl -X POST https://YOUR_SUPABASE_URL/functions/v1/crawl-medical-news -H "Authorization: Bearer YOUR_ANON_KEY"
\`\`\`

## Impact Scoring Algorithm

The system automatically calculates impact scores (0-100) based on:

1. **Base Score**: 70 points
2. **High-Impact Keywords** (+8 each):
   - breakthrough, revolutionary, first-ever, unprecedented, game-changing
3. **Medium-Impact Keywords** (+4 each):
   - significant, important, major, advances, improves
4. **Prestigious Sources** (+10):
   - Nature, Science, The Lancet, NEJM, JAMA, PubMed

## Auto-Categorization

Articles are automatically categorized by keyword matching:
- Diagnostics: diagnosis, diagnostic, detection, screening
- Surgery: surgery, surgical, robotic, operation
- Drug Discovery: drug, pharmaceutical, molecule, therapy
- Medical Imaging: MRI, CT scan, X-ray, radiology
- Genomics: genomic, genetic, DNA, gene
- Patient Care: patient care, monitoring, virtual assistant
- Clinical Trials: clinical trial, study, research
- Telemedicine: telemedicine, telehealth, remote, virtual

## Data Sources

Currently crawling:
- **Google News RSS** - Real-time news aggregation
- **Automatic deduplication** by URL

Future integrations (recommended):
- PubMed API for research papers
- arXiv for preprints
- Nature/Science APIs
- Medical journal RSS feeds
- Academic press releases

## Monitoring & Maintenance

### Check Crawler Status
\`\`\`sql
SELECT COUNT(*), MAX(created_at) as latest_crawl
FROM medical_news;
\`\`\`

### View Recent Articles
\`\`\`sql
SELECT title, category, impact_score, published_at
FROM medical_news
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

### Category Distribution
\`\`\`sql
SELECT category, COUNT(*) as count
FROM medical_news
GROUP BY category
ORDER BY count DESC;
\`\`\`

## Next Steps

1. ✅ Deploy Edge Function to Supabase
2. ✅ Run initial crawl to populate database
3. ⏰ Set up hourly cron job
4. 📊 Monitor crawl success rate
5. 🔧 Fine-tune keywords and categorization
6. 🚀 Add additional data sources (PubMed, arXiv)

## Troubleshooting

**No articles appearing?**
- Check Edge Function logs in Supabase dashboard
- Verify database table exists and RLS policies allow reading
- Manually trigger crawler to test

**Duplicate articles?**
- System automatically deduplicates by URL
- Check if source URLs are normalized

**Poor categorization?**
- Adjust keyword weights in categorization function
- Add domain-specific keywords for better matching

**Low impact scores?**
- Review impact scoring algorithm
- Adjust weights for different keywords
- Consider source reputation more heavily