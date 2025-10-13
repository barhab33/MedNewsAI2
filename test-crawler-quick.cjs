require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapeArticle(url) {
  try {
    console.log('  Fetching article...');
    const response = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    $('script, style, nav, header, footer').remove();

    const paragraphs = [];
    $('article p, .article p, .content p, main p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && paragraphs.length < 3) {
        paragraphs.push(text);
      }
    });

    return paragraphs.join('\\n\\n');
  } catch (error) {
    console.log('  Scrape failed:', error.message);
    return '';
  }
}

async function summarize(title, content) {
  if (!GEMINI_API_KEY) {
    return content.slice(0, 300) + '...';
  }

  try {
    console.log('  Calling Gemini...');
    const prompt = `Summarize this medical AI news in 2-3 sentences:\n\nTitle: ${title}\nContent: ${content.slice(0, 1500)}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 20000 }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (summary) {
      console.log('  ✓ Got summary');
      return summary.trim();
    }
  } catch (error) {
    console.log('  Gemini error:', error.response?.status || error.message);
  }

  return content.slice(0, 300) + '...';
}

async function testQuick() {
  console.log('Testing quick crawler...\n');

  const testArticle = {
    title: 'AI said I had Lyme disease before a doctor did',
    url: 'https://www.bbc.com/news/articles/c93qe39px9vo',
    source: 'BBC',
    category: 'Diagnostics',
    published_at: new Date().toISOString()
  };

  console.log(`Testing: ${testArticle.title}\n`);

  const content = await scrapeArticle(testArticle.url);
  console.log(`Scraped ${content.length} chars\n`);

  if (content.length > 100) {
    console.log('Sample content:', content.slice(0, 200) + '...\n');
  }

  const summary = await summarize(testArticle.title, content || testArticle.title);
  console.log('Summary:', summary, '\n');

  const { error } = await supabase
    .from('medical_news')
    .insert({
      title: testArticle.title,
      summary: summary,
      content: summary,
      category: testArticle.category,
      source: testArticle.source,
      original_source: testArticle.source,
      source_url: testArticle.url,
      image_url: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
      published_at: testArticle.published_at
    });

  if (error) {
    console.error('DB Error:', error.message);
  } else {
    console.log('✓ Saved to database!');
  }
}

testQuick();
