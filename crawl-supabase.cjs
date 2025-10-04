// Supabase-based crawler - no database password needed!
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available
  }
}

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_NEWS_QUERIES = [
  'artificial intelligence healthcare breakthrough',
  'AI medical diagnosis',
  'machine learning drug discovery',
  'AI radiology imaging',
  'deep learning cancer detection',
];

const MAX_ARTICLES_PER_RUN = 10;

const AI_PROVIDERS = [
  {
    name: 'Google Gemini',
    id: 'gemini',
    envKey: 'GEMINI_API_KEY',
    requestsPerMinute: 60,
    enabled: false,
    count: 0,
    generate: async (apiKey, title, category, source, type = 'summary') => {
      const summaryPrompt = `You are a medical AI news editor. Based ONLY on this title, write a compelling 2-3 sentence summary.

Title: "${title}"
Category: ${category}
Source: ${source}

Write a natural, specific summary that:
- Sounds concrete and informative (infer details from the title)
- Mentions specific elements from the title
- Avoids generic phrases like "highlights advancement"
- Write ONLY the summary, no preamble.`;

      const contentPrompt = `You are a medical AI news editor. Expand this into a detailed 3-paragraph article.

Title: "${title}"
Category: ${category}
Source: ${source}

Write 3 well-developed paragraphs that sound authoritative and specific. No preamble:`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: type === 'summary' ? summaryPrompt : contentPrompt }]
          }]
        },
        { timeout: 15000 }
      );

      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    }
  },
  {
    name: 'Groq (Llama)',
    id: 'groq',
    envKey: 'GROQ_API_KEY',
    requestsPerMinute: 30,
    enabled: false,
    count: 0,
    generate: async (apiKey, title, category, source, type = 'summary') => {
      const summaryPrompt = `Based on this title, write a compelling 2-3 sentence medical news summary. Be specific and concrete, avoid generic phrases.

Title: "${title}"
Category: ${category}

Write ONLY the summary:`;

      const contentPrompt = `Expand this medical news story into 3 detailed paragraphs:

Title: "${title}"
Category: ${category}

Write 3 paragraphs:`;

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: type === 'summary' ? summaryPrompt : contentPrompt }],
          temperature: 0.7,
          max_tokens: type === 'summary' ? 200 : 600
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return response.data?.choices?.[0]?.message?.content?.trim();
    }
  }
];

let currentProviderIndex = 0;
let lastResetTime = Date.now();

function initializeProviders() {
  AI_PROVIDERS.forEach(provider => {
    const apiKey = process.env[provider.envKey];
    provider.enabled = !!apiKey;
    provider.count = 0;
    if (provider.enabled) {
      console.log(`✅ ${provider.name} enabled`);
    }
  });

  const enabledCount = AI_PROVIDERS.filter(p => p.enabled).length;
  if (enabledCount === 0) {
    console.error('❌ No AI providers configured! Add at least one API key.');
    process.exit(1);
  }
  console.log(`🤖 ${enabledCount} AI provider(s) ready\n`);
}

function getNextProvider() {
  const enabledProviders = AI_PROVIDERS.filter(p => p.enabled);
  if (enabledProviders.length === 0) return null;

  const now = Date.now();
  if (now - lastResetTime >= 60000) {
    enabledProviders.forEach(p => p.count = 0);
    lastResetTime = now;
  }

  let attempts = 0;
  while (attempts < enabledProviders.length) {
    const provider = enabledProviders[currentProviderIndex % enabledProviders.length];

    if (provider.count < provider.requestsPerMinute) {
      currentProviderIndex++;
      return provider;
    }

    currentProviderIndex++;
    attempts++;
  }

  return null;
}

async function generateWithAI(title, category, source, type = 'summary') {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const provider = getNextProvider();

    if (!provider) {
      console.log('⏳ Rate limit reached, waiting 60s...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      continue;
    }

    try {
      const apiKey = process.env[provider.envKey];
      provider.count++;

      const result = await provider.generate(apiKey, title, category, source, type);

      if (result && result.length > 20) {
        return result;
      }
    } catch (error) {
      console.log(`⚠️  ${provider.name} failed (attempt ${attempt + 1}/${maxRetries})`);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  return type === 'summary'
    ? `Latest developments in ${category.toLowerCase()} showcase new possibilities for AI in healthcare.`
    : `This article explores recent advancements in ${category.toLowerCase()}.\n\nResearchers continue to push boundaries in medical AI applications.\n\nThese developments represent significant progress in healthcare technology.`;
}

async function searchGoogleNews(query) {
  try {
    const response = await axios.get('https://news.google.com/rss/search', {
      params: { q: query, hl: 'en-US', gl: 'US', ceid: 'US:en' },
      timeout: 10000
    });

    const articles = [];
    const titleMatches = response.data.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of titleMatches) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/);

      if (titleMatch && linkMatch) {
        const fullTitle = titleMatch[1];
        const parts = fullTitle.split(' - ');
        const title = parts.length > 1 ? parts.slice(0, -1).join(' - ') : fullTitle;

        articles.push({
          title: title.substring(0, 500),
          url: linkMatch[1].substring(0, 500),
          published_at: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          source: sourceMatch ? sourceMatch[1].substring(0, 200) : 'Medical AI News',
          category: inferCategory(title)
        });
      }
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching news for "${query}":`, error.message);
    return [];
  }
}

function inferCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('diagnos') || lower.includes('detect') || lower.includes('screen')) return 'Diagnostics';
  if (lower.includes('drug') || lower.includes('treatment') || lower.includes('therapy')) return 'Drug Discovery';
  if (lower.includes('robot') || lower.includes('surger')) return 'Robotics';
  if (lower.includes('image') || lower.includes('scan') || lower.includes('mri') || lower.includes('ct')) return 'Medical Imaging';
  if (lower.includes('patient') || lower.includes('care') || lower.includes('hospital')) return 'Patient Care';
  return 'Research';
}

async function processArticles() {
  console.log('🔍 Searching Google News...\n');

  const allArticles = [];
  for (const query of GOOGLE_NEWS_QUERIES) {
    const articles = await searchGoogleNews(query);
    allArticles.push(...articles);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`📰 Found ${allArticles.length} total articles`);

  // Check existing articles
  const { data: existing } = await supabase
    .from('medical_news')
    .select('url');

  const existingUrls = new Set(existing?.map(a => a.url) || []);
  const newArticles = allArticles.filter(a => !existingUrls.has(a.url));

  console.log(`✨ ${newArticles.length} new articles to process`);

  const articlesToProcess = newArticles.slice(0, MAX_ARTICLES_PER_RUN);
  console.log(`⚡ Processing ${articlesToProcess.length} articles\n`);

  let successCount = 0;

  for (let i = 0; i < articlesToProcess.length; i++) {
    const article = articlesToProcess[i];
    console.log(`\n[${i + 1}/${articlesToProcess.length}] ${article.title.substring(0, 60)}...`);

    try {
      const summary = await generateWithAI(article.title, article.category, article.source, 'summary');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const content = await generateWithAI(article.title, article.category, article.source, 'content');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error } = await supabase
        .from('medical_news')
        .insert({
          title: article.title,
          summary: summary,
          content: content,
          url: article.url,
          source: article.source,
          category: article.category,
          published_at: article.published_at,
          image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800'
        });

      if (error) {
        console.log(`   ❌ Database error: ${error.message}`);
      } else {
        successCount++;
        console.log(`   ✅ Saved successfully`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log(`\n✅ Complete! ${successCount}/${articlesToProcess.length} articles saved`);
}

async function main() {
  console.log('🚀 Medical AI News Crawler (Supabase Edition)\n');
  initializeProviders();

  try {
    await processArticles();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
