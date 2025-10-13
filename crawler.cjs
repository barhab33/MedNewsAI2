require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MEDICAL_AI_SOURCES = [
  {
    name: 'Nature Medicine',
    rssUrl: 'https://www.nature.com/nm.rss',
    priority: 10
  },
  {
    name: 'Google News - Medical AI',
    searchQuery: 'artificial intelligence medical diagnosis treatment',
    priority: 8
  },
  {
    name: 'Google News - AI Healthcare',
    searchQuery: 'AI healthcare breakthrough radiology surgery',
    priority: 8
  }
];

const CATEGORIES = [
  'Diagnostics',
  'Surgery',
  'Drug Discovery',
  'Patient Care',
  'Medical Imaging',
  'Clinical Decision Support',
  'Genomics',
  'Public Health',
  'Other'
];

async function searchGoogleNews(query) {
  console.log(`Searching Google News for: ${query}`);
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const articles = [];
    $('item').each((_, item) => {
      const title = $(item).find('title').text();
      const link = $(item).find('link').text();
      const pubDate = $(item).find('pubDate').text();
      const description = $(item).find('description').text();

      if (title && link && (
        title.toLowerCase().includes('ai') ||
        title.toLowerCase().includes('artificial intelligence') ||
        title.toLowerCase().includes('machine learning') ||
        description.toLowerCase().includes('ai') ||
        description.toLowerCase().includes('artificial intelligence')
      )) {
        articles.push({
          title,
          url: link,
          source: 'Google News',
          description,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          priority: 7
        });
      }
    });

    console.log(`Found ${articles.length} articles from Google News`);
    return articles;
  } catch (error) {
    console.error('Error searching Google News:', error.message);
    return [];
  }
}

async function fetchRSS(url, sourceName, priority) {
  console.log(`Fetching RSS from ${sourceName}...`);
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const articles = [];
    $('item').each((_, item) => {
      const title = $(item).find('title').text();
      const link = $(item).find('link').text();
      const pubDate = $(item).find('pubDate').text() || $(item).find('published').text();
      const description = $(item).find('description').text() || $(item).find('summary').text();

      if (title && link) {
        articles.push({
          title,
          url: link,
          source: sourceName,
          description,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          priority
        });
      }
    });

    console.log(`Found ${articles.length} articles from ${sourceName}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching RSS from ${sourceName}:`, error.message);
    return [];
  }
}

async function scrapeWebPage(url, sourceName, priority) {
  console.log(`Scraping ${sourceName}...`);
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    const articles = [];

    $('article, .article, [class*="article"], [class*="post"]').each((_, element) => {
      const $article = $(element);
      const titleEl = $article.find('h1, h2, h3, .title, [class*="title"]').first();
      const linkEl = $article.find('a[href]').first();
      const descEl = $article.find('p, .description, [class*="description"], .summary').first();
      const dateEl = $article.find('time, .date, [class*="date"]').first();

      const title = titleEl.text().trim();
      let link = linkEl.attr('href');
      const description = descEl.text().trim();
      const dateStr = dateEl.attr('datetime') || dateEl.text().trim();

      if (link && !link.startsWith('http')) {
        const base = new URL(url);
        link = base.origin + (link.startsWith('/') ? link : '/' + link);
      }

      if (title && link && title.length > 10) {
        articles.push({
          title,
          url: link,
          source: sourceName,
          description,
          published_at: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
          priority
        });
      }
    });

    console.log(`Found ${articles.length} articles from ${sourceName}`);
    return articles;
  } catch (error) {
    console.error(`Error scraping ${sourceName}:`, error.message);
    return [];
  }
}

async function gatherAllArticles() {
  console.log('\n=== Gathering articles from all sources ===\n');
  const allArticles = [];

  for (const source of MEDICAL_AI_SOURCES) {
    if (source.rssUrl) {
      const articles = await fetchRSS(source.rssUrl, source.name, source.priority);
      allArticles.push(...articles);
    } else if (source.searchQuery) {
      const articles = await searchGoogleNews(source.searchQuery);
      allArticles.push(...articles);
    } else if (source.url) {
      const articles = await scrapeWebPage(source.url, source.name, source.priority);
      allArticles.push(...articles);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\nTotal articles gathered: ${allArticles.length}`);
  return allArticles;
}

function selectTop15(articles) {
  console.log('\n=== Selecting top 15 articles ===\n');

  const uniqueArticles = Array.from(
    new Map(articles.map(a => [a.url, a])).values()
  );

  const scored = uniqueArticles.map(article => ({
    ...article,
    score: article.priority + (new Date(article.published_at) > new Date(Date.now() - 7*24*60*60*1000) ? 5 : 0)
  }));

  scored.sort((a, b) => b.score - a.score);

  const top15 = scored.slice(0, 15);
  console.log(`Selected ${top15.length} articles`);
  return top15;
}

async function scrapeArticleContent(url) {
  try {
    console.log('  Fetching article body...');
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    $('script, style, nav, header, footer, aside, .advertisement, .ad, .social-share').remove();

    const paragraphs = [];
    $('article p, .article p, .content p, .post-content p, main p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && paragraphs.length < 5) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length > 0) {
      console.log(`  Found ${paragraphs.length} paragraphs`);
      return paragraphs.join('\\n\\n');
    }

    console.log('  No content found, will use description');
    return '';
  } catch (error) {
    console.log('  Scraping failed:', error.message);
    return '';
  }
}

async function summarizeWithGemini(article, fullContent) {
  console.log(`  Summarizing: ${article.title.slice(0, 60)}...`);

  const contentToSummarize = fullContent || article.description || '';

  if (!contentToSummarize || contentToSummarize.length < 50) {
    console.log('  Using title only (no content available)');
    return `${article.title} - Full article available at source.`;
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
    console.log('  No valid Gemini key, using content excerpt');
    const excerpt = contentToSummarize.slice(0, 300);
    return excerpt + (contentToSummarize.length > 300 ? '...' : '');
  }

  try {
    const prompt = `Summarize this medical AI news article in 2-3 sentences. Focus on the key innovation and its medical impact:

Title: ${article.title}
Content: ${contentToSummarize.slice(0, 2000)}

Provide only the summary, no preamble.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 20000 }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (summary && summary.length > 50) {
      console.log('  ✓ Got AI summary');
      return summary.trim();
    }
  } catch (error) {
    console.log('  Gemini failed, using excerpt');
  }

  const excerpt = contentToSummarize.slice(0, 300);
  return excerpt + (contentToSummarize.length > 300 ? '...' : '');
}

function categorizeMedicalAI(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();

  if (text.includes('diagnos') || text.includes('detect') || text.includes('screening')) return 'Diagnostics';
  if (text.includes('surgery') || text.includes('surgical') || text.includes('robot')) return 'Surgery';
  if (text.includes('drug') || text.includes('pharmaceutical') || text.includes('molecule')) return 'Drug Discovery';
  if (text.includes('patient care') || text.includes('treatment') || text.includes('therapy')) return 'Patient Care';
  if (text.includes('imaging') || text.includes('mri') || text.includes('ct scan') || text.includes('x-ray') || text.includes('radiology')) return 'Medical Imaging';
  if (text.includes('clinical decision') || text.includes('ehr') || text.includes('electronic health')) return 'Clinical Decision Support';
  if (text.includes('genom') || text.includes('dna') || text.includes('gene') || text.includes('sequencing')) return 'Genomics';
  if (text.includes('public health') || text.includes('epidemic') || text.includes('population')) return 'Public Health';

  return 'Other';
}

async function findImageForArticle(article) {
  console.log(`Finding image for: ${article.title.slice(0, 50)}...`);

  try {
    const response = await axios.get(article.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      console.log('Found og:image');
      return ogImage;
    }

    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage) {
      console.log('Found twitter:image');
      return twitterImage;
    }

    const firstImg = $('article img, .article img, .content img').first().attr('src');
    if (firstImg) {
      if (!firstImg.startsWith('http')) {
        const base = new URL(article.url);
        return base.origin + (firstImg.startsWith('/') ? firstImg : '/' + firstImg);
      }
      console.log('Found article image');
      return firstImg;
    }
  } catch (error) {
    console.log('Could not fetch image from article');
  }

  const stockImages = [
    'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
    'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg',
    'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
    'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg',
    'https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg'
  ];

  const randomImage = stockImages[Math.floor(Math.random() * stockImages.length)];
  console.log('Using stock image');
  return randomImage;
}

async function saveToSupabase(articles) {
  console.log('\n=== Saving to Supabase ===\n');

  const { data: existing } = await supabase
    .from('medical_news')
    .select('source_url');

  const existingUrls = new Set(existing?.map(e => e.source_url) || []);

  let saved = 0;

  for (const article of articles) {
    if (existingUrls.has(article.url)) {
      console.log(`Skipping duplicate: ${article.title.slice(0, 50)}...`);
      continue;
    }

    console.log(`Scraping content from: ${article.url.slice(0, 60)}...`);
    const fullContent = await scrapeArticleContent(article.url);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = await summarizeWithGemini(article, fullContent);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const image_url = await findImageForArticle(article);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const category = categorizeMedicalAI(article);

    const { error } = await supabase
      .from('medical_news')
      .insert({
        title: article.title,
        summary: summary,
        content: summary,
        category,
        source: article.source,
        original_source: article.source,
        source_url: article.url,
        image_url,
        published_at: article.published_at
      });

    if (error) {
      console.error(`Error saving article: ${error.message}`);
    } else {
      saved++;
      console.log(`✓ Saved: ${article.title.slice(0, 60)}...`);
    }
  }

  console.log(`\nSaved ${saved} new articles to database`);
}

async function cleanupOldArticles() {
  console.log('\n=== Cleaning up old articles ===\n');

  const { data } = await supabase
    .from('medical_news')
    .select('id, published_at')
    .order('published_at', { ascending: false });

  if (data && data.length > 50) {
    const toDelete = data.slice(50).map(a => a.id);
    const { error } = await supabase
      .from('medical_news')
      .delete()
      .in('id', toDelete);

    if (!error) {
      console.log(`Deleted ${toDelete.length} old articles`);
    }
  } else {
    console.log('No cleanup needed');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Medical AI News Crawler');
  console.log('='.repeat(60));

  try {
    const allArticles = await gatherAllArticles();
    const top15 = selectTop15(allArticles);
    await saveToSupabase(top15);
    await cleanupOldArticles();

    console.log('\n✓ Crawler completed successfully!');
  } catch (error) {
    console.error('\n✗ Crawler failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
