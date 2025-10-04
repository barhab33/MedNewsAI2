# GitHub Workflow Fixed - No Password Needed!

## The Problem
Your GitHub Actions workflows were failing because they required the database password (`SUPABASE_DB_PASSWORD`), which is complex to manage and secure.

## The Solution
I've **completely eliminated** the need for database passwords by converting all scripts to use **Supabase's JavaScript client** instead of direct PostgreSQL connections.

## What Changed

### New Files Created
- **`crawl-supabase.cjs`** - New crawler using Supabase client (no password)
- **`WORKFLOW_FIX.md`** - This documentation

### Files Updated
- **`export-to-public.cjs`** - Now uses Supabase client
- **`assign-unique-images.cjs`** - Now uses Supabase client
- **`.github/workflows/manual-update.yml`** - Uses new crawler
- **`.github/workflows/update-news.yml`** - Uses new crawler

## Required GitHub Secrets

You **ONLY** need these 4 secrets (no database password needed):

1. **`VITE_SUPABASE_URL`**
   - Value: `https://0ec90b57d6e95fcbda19832f.supabase.co`

2. **`VITE_SUPABASE_ANON_KEY`**
   - Value: (your anon key from `.env`)

3. **`GROQ_API_KEY`**
   - Get from: https://console.groq.com

4. **`GEMINI_API_KEY`**
   - Get from: https://aistudio.google.com/apikey

## How to Test

1. Push these changes to GitHub
2. Go to **Actions** tab
3. Click **Manual News Update**
4. Click **Run workflow**
5. Select number of articles (5, 10, 20, or 50)
6. Click **Run workflow**

It should work without needing the database password!

## Why This Works Better

**Before:**
- Required PostgreSQL password
- Direct database connection
- Complex secret management
- Harder to debug

**After:**
- Uses Supabase JavaScript client
- Only needs URL + anon key (already public)
- Works everywhere (local + GitHub Actions)
- Much simpler and more secure

## Local Testing

You can test the new scripts locally:

```bash
node crawl-supabase.cjs      # Crawl news (needs AI API keys)
node export-to-public.cjs    # Export to JSON
node assign-unique-images.cjs # Assign images
```

All scripts now use the same Supabase credentials from your `.env` file.
