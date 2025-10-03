# Multi-AI Summary Generation Setup

Your crawler now uses **5 different free AI providers** with automatic rotation and fallback!

## 🎯 How It Works

1. **Round-Robin Rotation**: Distributes requests evenly across all available AI providers
2. **Automatic Fallback**: If one provider fails or hits rate limits, automatically tries the next
3. **Rate Limit Management**: Tracks usage per provider and switches before hitting limits
4. **Quality Summaries**: Real AI generates specific, engaging content from article titles

## 🤖 Supported AI Providers (All Free!)

### 1. Google Gemini ⭐ RECOMMENDED
- **Rate Limit**: 60 requests/minute
- **Free Tier**: 1,500 requests/day
- **Quality**: Excellent
- **Model**: Gemini Pro

**How to get:**
1. Visit https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy your key

### 2. Groq (Ultra-Fast)
- **Rate Limit**: 30 requests/minute
- **Free Tier**: 14,400 requests/day
- **Quality**: Excellent
- **Model**: Mixtral 8x7B
- **Speed**: 18x faster than GPUs!

**How to get:**
1. Visit https://console.groq.com/
2. Sign up (no credit card)
3. Go to API Keys section
4. Create new key

### 3. Together AI
- **Rate Limit**: 60 requests/minute
- **Free Tier**: $25 free credits for new users
- **Quality**: Very Good
- **Model**: Mixtral 8x7B

**How to get:**
1. Visit https://api.together.xyz/signup
2. Sign up (no credit card for free tier)
3. Go to Settings → API Keys
4. Generate new key

### 4. OpenRouter (Access to 300+ Models)
- **Rate Limit**: 20 requests/minute
- **Free Tier**: 200 requests/day on free models
- **Quality**: Good
- **Model**: Gemini 2.0 Flash (free)

**How to get:**
1. Visit https://openrouter.ai/
2. Sign up
3. Go to Keys section
4. Create API key
5. Select free models in usage

### 5. Hugging Face
- **Rate Limit**: 30 requests/minute
- **Free Tier**: Unlimited (rate limited)
- **Quality**: Good
- **Model**: Mixtral 8x7B

**How to get:**
1. Visit https://huggingface.co/settings/tokens
2. Create account
3. Click "New token"
4. Create with "read" permissions

## ⚙️ Setup Instructions

### Step 1: Add API Keys to .env

Open your `.env` file and add any/all of these:

```bash
# Recommended: Add at least 2-3 providers for best results
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
TOGETHER_API_KEY=your_together_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here
```

**You don't need all 5!** The crawler works with any combination:
- ✅ Just 1 key: Works fine, will hit rate limits eventually
- ✅✅ 2-3 keys: **Recommended** - Great balance and reliability
- ✅✅✅✅✅ All 5 keys: Maximum capacity (200+ requests/minute!)

### Step 2: Run the Multi-AI Crawler

```bash
node crawl-multi-ai.cjs
```

## 📊 What You'll See

```
🚀 Starting Multi-AI Medical News Crawler

🤖 Supported AI Providers:
   - Google Gemini (60 req/min)
   - Groq (30 req/min)
   - Together AI (60 req/min)
   - OpenRouter (20 req/min)
   - Hugging Face (30 req/min)

✓ Google Gemini enabled
✓ Groq enabled
✓ Together AI enabled

✓ 3 AI provider(s) ready

🔍 Searching: "AI medical diagnosis"...
  Found 100 articles

  📰 Adding a Lookup Step Makes AI Better at Assigning Medical Di...
     Category: Diagnostics | Source: Mount Sinai
    🤖 Using Google Gemini...
    ✓ Generated with Google Gemini

  📰 Microsoft Says Its New AI System Diagnosed Patients 4 Times ...
     Category: Diagnostics | Source: WIRED
    🤖 Using Groq (Mixtral)...
    ✓ Generated with Groq (Mixtral)

  📰 Transforming diagnosis through artificial intelligence...
     Category: Diagnostics | Source: Nature
    🤖 Using Together AI...
    ✓ Generated with Together AI

📊 AI Usage: Google Gemini: 15 requests, Groq: 14 requests, Together AI: 11 requests

✅ Crawl complete!
```

## 🎁 Benefits of Multi-AI Setup

### 1. **Higher Capacity**
- Single provider: ~60 requests/minute max
- Multiple providers: 200+ requests/minute combined!

### 2. **Better Reliability**
- If one provider is down, others keep working
- No single point of failure

### 3. **Cost Optimization**
- Spreads load across free tiers
- Maximizes free quota usage

### 4. **Diverse Outputs**
- Different AI models provide variety
- Reduces repetitive patterns

### 5. **Rate Limit Protection**
- Automatically switches before hitting limits
- Smart rotation prevents blocks

## 💡 Pro Tips

1. **Start with Gemini + Groq** (easiest to set up, best quality)
2. **Add Together AI** if you need more capacity
3. **Use OpenRouter** for access to multiple models through one API
4. **Hugging Face** is truly unlimited (just rate limited per minute)

## 🔄 How Rotation Works

The crawler uses **round-robin** scheduling:

```
Article 1 → Gemini
Article 2 → Groq
Article 3 → Together AI
Article 4 → Gemini (back to start)
...and so on
```

If a provider fails or is rate limited, it **automatically skips** to the next available provider.

## 📈 Recommended Combinations

### Minimal Setup (1 key)
```bash
GEMINI_API_KEY=xxx  # Best single option
```

### Balanced Setup (2 keys) ⭐
```bash
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx
```
Combined capacity: 90 requests/minute

### Power Setup (3 keys)
```bash
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx
TOGETHER_API_KEY=xxx
```
Combined capacity: 150 requests/minute

### Maximum Setup (All 5)
```bash
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx
TOGETHER_API_KEY=xxx
OPENROUTER_API_KEY=xxx
HUGGINGFACE_API_KEY=xxx
```
Combined capacity: 200+ requests/minute

## ❓ FAQ

**Q: Do I need all 5 API keys?**
A: No! Start with just Gemini or Groq. Add more as needed.

**Q: Are these really free?**
A: Yes! No credit card required for any of them.

**Q: Which provider is best?**
A: Gemini has the best quality, Groq is fastest, Together AI is most generous with credits.

**Q: What happens without any API keys?**
A: The crawler still works using smart fallback summaries (not as good as AI).

**Q: Can I use just one provider?**
A: Yes, but you'll hit rate limits faster. 2-3 providers recommended.

## 🚀 Quick Start (5 Minutes)

1. Get Gemini key: https://aistudio.google.com/apikey
2. Get Groq key: https://console.groq.com/
3. Add both to `.env`
4. Run `node crawl-multi-ai.cjs`
5. Enjoy AI-generated summaries!

---

**All providers are 100% free and require no credit card!** 🎉
