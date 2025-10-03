# 🏥 Medical AI News - Automated News Aggregator

An automated medical AI news website that crawls, generates, and publishes articles using AI every 8 hours.

## ✨ Features

- 🤖 **Automated Updates**: GitHub Actions runs every 8 hours
- 🧠 **AI-Generated Content**: Uses Groq & Gemini AI for summaries
- 🗄️ **Supabase Backend**: PostgreSQL database with edge functions
- 🎨 **Unique Images**: Each article has a distinct medical image from Pexels
- 🔒 **Production Security**: HTTPS, CSP, HSTS, and secure headers
- 📱 **Responsive Design**: Beautiful UI with Tailwind CSS

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials.

### 3. Setup GitHub Secrets
Go to your repository Settings → Secrets → Actions and add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_DB_PASSWORD`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

### 4. Enable GitHub Actions
The workflows in `.github/workflows/` will run automatically:
- **update-news.yml**: Runs every 8 hours
- **manual-update.yml**: Manual trigger with customizable article count

## 🤖 How Automation Works

```
GitHub Actions (Every 8 hours)
    ↓
Crawl Google News RSS
    ↓
Generate AI Summaries
    ↓
Store in Database
    ↓
Export to JSON
    ↓
Auto-commit & Push
    ↓
Fresh Articles Live!
```

## 📜 Available Scripts

```bash
npm run dev              # Development server
npm run build           # Production build
node crawl-multi-ai.cjs # Crawl and generate articles
node export-to-public.cjs # Export to JSON
node assign-unique-images.cjs # Assign images
```

## 🔒 Security

- SSL/TLS encryption
- HTTP security headers
- Environment variables for secrets
- See [SECURITY.md](SECURITY.md) for details

## 🚀 Deployment

Build files are in `dist/` folder with security headers configured for Netlify and Vercel.
