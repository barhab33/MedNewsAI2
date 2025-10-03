# 🚀 Quick Start - Automatic News Updates Every 2 Hours

Your medical AI news website updates automatically!

## Start Automatic Updates

Just run this one command:

```bash
npm run auto-update
```

That's it! The crawler will:
- ✅ Run immediately to get fresh articles
- ✅ Then automatically run every 2 hours
- ✅ Keep your website updated with latest AI medical news
- ✅ Use Gemini AI to generate intelligent summaries

Keep this terminal window open and let it run in the background.

## View Your Website

Visit: **http://localhost:5173**

Articles will automatically refresh every 2 hours!

---

## Alternative: Run Once Manually

If you just want to update once:

```bash
npm run crawl
```

---

## What's Happening

When `npm run auto-update` is running:
1. Crawls Google News for AI medical articles
2. Uses Gemini AI to generate summaries and content
3. Saves to database
4. Exports to `/public/news-data.json`
5. Website automatically shows new articles
6. Waits 2 hours and repeats forever

---

## Running in Production (Keep it Running 24/7)

### Option 1: PM2 (Recommended for servers)

```bash
npm install -g pm2
pm2 start auto-update.cjs --name "medical-news"
pm2 save
pm2 startup  # Follow instructions to start on boot
```

Monitor:
```bash
pm2 status
pm2 logs medical-news
```

### Option 2: nohup (Simple Linux/Mac)

```bash
nohup npm run auto-update > updater.log 2>&1 &
```

Check log:
```bash
tail -f updater.log
```

### Option 3: screen (Keep terminal alive)

```bash
screen -S news-updater
npm run auto-update
# Press Ctrl+A then D to detach
```

Reattach:
```bash
screen -r news-updater
```

---

## Environment Requirements

Make sure `.env` has:
```
GEMINI_API_KEY=your_key_here
```

Get your free Gemini API key at: https://makersuite.google.com/app/apikey

---

## Development

Run site and updater separately:

**Terminal 1** (website):
```bash
npm run dev
```

**Terminal 2** (auto-updater):
```bash
npm run auto-update
```

---

## Troubleshooting

**Articles aren't updating:**
1. Check `npm run auto-update` is still running
2. Look for errors in console
3. Verify Gemini API key in `.env`
4. Check internet connection

**To restart:**
```bash
# Stop with Ctrl+C, then:
npm run auto-update
```

That's it! Your site updates itself automatically every 2 hours. 🎉
