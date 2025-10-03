# GitHub Secrets Setup

To enable automated news updates every 8 hours, you need to add the following secrets to your GitHub repository.

## Steps to Add Secrets

1. Go to your GitHub repository: https://github.com/YOUR_USERNAME/MedNewsAI-2
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each of the following:

## Required Secrets

### 1. GROQ_API_KEY
- **Value**: `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`
- **Description**: Groq API key for AI summaries

### 2. GEMINI_API_KEY
- **Value**: `AIzaSyAYVNaJ30x7fRATb5aLX5z-pmOFNnFeBk0`
- **Description**: Google Gemini API key for AI summaries

### 3. VITE_SUPABASE_URL
- **Value**: `https://0ec90b57d6e95fcbda19832f.supabase.co`
- **Description**: Supabase project URL

### 4. VITE_SUPABASE_ANON_KEY
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw`
- **Description**: Supabase anonymous key

## Automation Details

Once secrets are configured, the workflow will:
- Run every 8 hours automatically (at 00:00, 08:00, and 16:00 UTC)
- Fetch 10 new medical AI articles
- Generate AI summaries using Groq and Gemini
- Update the `public/news-data.json` file
- Commit and push changes automatically

You can also manually trigger the workflow from the Actions tab in GitHub.

## Manual Trigger

To manually run the news update:
1. Go to **Actions** tab in your repository
2. Click on **Update Medical AI News** workflow
3. Click **Run workflow** button
