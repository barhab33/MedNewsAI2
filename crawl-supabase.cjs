// Supabase-based crawler for medical news
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Medical news sources
const SOURCES = [
  {
    name: 'Medical News Today',
    url: 'https://www.medicalnewstoday.com',
    category: 'general'
  },
  {
    name: 'WebMD News',
    url: 'https://www.webmd.com/news/default.htm',
    category: 'general'
  },
  {
    name: 'ScienceDaily Health',
    url: 'https://www.sciencedaily.com/news/health_medicine/',
    category: 'research'
  },
  {
    name: 'Healthline News',
    url: 'https://www.healthline.com/health-news',
    category: 'general'
  }
];

const MEDICAL_IMAGES = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d',
  'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf',
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8',
  'https://images.unsplash.com/photo-1583947215259-38e31be8751f',
  'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb'
];

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

async function summarizeWithOpenAI(title, content) {
  if (!OPENAI_API_KEY) return null;
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical news summarizer. Provide clear, accurate summaries in 2-3 sentences.'
          },
          {
            role: 'user',
            content: `Summarize this medical news article:\n\nTitle: ${title}\n\nContent: ${content.substring(0, 2000)}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return null;
  }
}

async function summarizeWithAnthropic(title, content) {
  if (!ANTHROPIC_API_KEY) return null;
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Summarize this medical news article in 2-3 sentences:\n\nTitle: ${title}\n\nContent: ${content.substring(0, 2000)}`
          }
        ]
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.content[0].text.trim();
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    return null;
  }
}

async function summarizeWithGemini(title, content) {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Summarize this medical news article in 2-3 sentences:\n\nTitle: ${title}\n\nContent: ${content.substring(0, 2000)}`
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return null;
  }
}

async function generateMultiLLMSummaries(title, content) {
  const [openai, anthropic, gemini] = await Promise.all([
    summarizeWithOpenAI(title, content),
    summarizeWithAnthropic(title, content),
    summarizeWithGemini(title, content)
  ]);

  return {
    openai_summary: openai,
    anthropic_summary: anthropic,
    gemini_summary: gemini
  };
}

function categorizeArticle(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.match(/cardio|heart|blood pressure|stroke/)) return 'cardiology';
  if (text.match(/cancer|oncology|tumor|chemotherapy/)) return 'oncology';
  if (text.match(/brain|neuro|alzheimer|parkinson/)) return 'neurology';
  if (text.match(/mental health|depression|anxiety|psychiatry/)) return 'mental-health';
  if (text.match(/diabetes|insulin|blood sugar/)) return 'endocrinology';
  if (text.match(/covid|virus|vaccine|pandemic/)) return 'infectious-disease';
  if (text.match(/drug|medication|pharmaceutical|fda approval/)) return 'pharmacology';
  if (text.match(/surgery|surgical|operation/)) return 'surgery';
  if (text.match(/child|pediatric|infant/)) return 'pediatrics';
  if (text.match(/women|pregnancy|maternal/)) return 'womens-health';
  
  return 'general';
}

function extractArticles(html, sourceUrl) {
  const $ = cheerio.load(html);
  const articles = [];
  
  $('article, .article, .news-item, .post').each((i, elem) => {
    const $elem = $(elem);
    const $link = $elem.find('a').first();
    const title = $link.text().trim() || $elem.find('h2, h3, .title').first().text().trim();
    let url = $link.attr('href');
    
    if (!title || !url) return;
    
    if (url.startsWith('/')) {
      const baseUrl = new URL(sourceUrl);
      url = `${baseUrl.origin}${url}`;
    }
    
    const excerpt = $elem.find('p, .excerpt, .description').first().text().trim().substring(0, 200);
    const imageUrl = $elem.find('img').first().attr('src') || MEDICAL_IMAGES[i % MEDICAL_IMAGES.length];
    
    articles.push({ title, url, excerpt, imageUrl });
  });
  
  return articles;
}

async function crawlSource(source) {
  console.log(`Crawling ${source.name}...`);
  
  try {
    const html = await fetchWithRetry(source.url);
    const articles = extractArticles(html, source.url);
    
    console.log(`Found ${articles.length} articles from ${source.name}`);
    
    for (const article of articles.slice(0, 5)) {
      try {
        const { data: existing } = await supabase
          .from('medical_news')
          .select('id')
          .eq('url', article.url)
          .maybeSingle();
        
        if (existing) {
          console.log(`Skipping duplicate: ${article.title}`);
          continue;
        }
        
        const fullContent = article.excerpt || article.title;
        const category = categorizeArticle(article.title, fullContent);
        const summaries = await generateMultiLLMSummaries(article.title, fullContent);
        
        const { error } = await supabase
          .from('medical_news')
          .insert({
            title: article.title,
            url: article.url,
            excerpt: article.excerpt || fullContent.substring(0, 200),
            content: fullContent,
            image_url: article.imageUrl,
            source: source.name,
            category: category,
            ...summaries,
            published_at: new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error inserting article:`, error.message);
        } else {
          console.log(`✓ Added: ${article.title}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing article:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error crawling ${source.name}:`, error.message);
  }
}

async function cleanOldArticles() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('medical_news')
    .delete()
    .lt('published_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error cleaning old articles:', error.message);
  } else {
    console.log('✓ Cleaned articles older than 30 days');
  }
}

async function main() {
  console.log('Starting medical news crawler...');
  console.log('Available APIs:', {
    OpenAI: !!OPENAI_API_KEY,
    Anthropic: !!ANTHROPIC_API_KEY,
    Gemini: !!GOOGLE_API_KEY
  });
  
  await cleanOldArticles();
  
  for (const source of SOURCES) {
    await crawlSource(source);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const { count } = await supabase
    .from('medical_news')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✓ Crawling complete! Total articles in database: ${count}`);
}

main();
