require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing Supabase credentials!');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MEDICAL_AI_SOURCES = [
  {
    name: 'Google News - AI Healthcare',
    searchQuery: 'artificial intelligence healthcare medical diagnosis treatment',
    priority: 8
  },
  {
    name: 'Google News - Medical AI Breakthrough',
    searchQuery: 'AI breakthrough medicine radiology surgery drug discovery',
    priority: 8
  }
];

const STOCK_IMAGES = [
  'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
  'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg',
  'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
  'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg',
  'https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg'
];

async function searchGoogleNews(query) {
  console.log(`\nSearching: ${query}`);
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const articles = [];
    $('item').each((_, item) => {
      const title = $(item).find('title').text().trim();
      const link = $(item).find('link').text().trim();
      const pubDate = $(item).find('pubDate').text().trim();
      const description = $(item).find('description').text().trim();

      const lowerText = (title + ' ' + description).toLowerCase();
      if (title && link && (
        lowerText.includes('ai') ||
        lowerText.includes('artificial intelligence') ||
        lowerText.includes('machine learning')
      )) {
        articles.push({
          title: title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
          url: link,
          description: description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: extractSource(description) || 'Google News'
        });
      }
    });

    console.log(`  Found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return [];
  }
}

function extractSource(description) {
  const match = description.match(/<a[^>]*>([^<]+)<\/a>/);
  return match ? match[1].trim() : null;
}

async function gatherArticles() {
  console.log('='.repeat(60));
  console.log('Gathering Medical AI News');
  console.log('='.repeat(60));

  const allArticles = [];

  for (const source of MEDICAL_AI_SOURCES) {
    if (source.searchQuery) {
      const articles = await searchGoogleNews(source.searchQuery);
      allArticles.push(...articles.map(a => ({ ...a, priority: source.priority })));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\nTotal gathered: ${allArticles.length} articles`);
  return allArticles;
}

function selectTop15(articles) {
  console.log('\n' + '='.repeat(60));
  console.log('Selecting Top 15 Articles');
  console.log('='.repeat(60));

  const uniqueArticles = Array.from(
    new Map(articles.map(a => [a.url, a])).values()
  );

  const scored = uniqueArticles.map(article => {
    const recencyBonus = new Date(article.published_at) > new Date(Date.now() - 7*24*60*60*1000) ? 5 : 0;
    return {
      ...article,
      score: article.priority + recencyBonus
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top15 = scored.slice(0, 15);

  console.log(`Selected ${top15.length} articles\n`);
  return top15;
}

function createSummary(article) {
  let summary = article.description || '';

  summary = summary.replace(/<[^>]*>/g, '');
  summary = summary.replace(/&nbsp;/g, ' ');
  summary = summary.replace(/&amp;/g, '&');
  summary = summary.replace(/&quot;/g, '"');
  summary = summary.replace(/&#39;/g, "'");
  summary = summary.replace(/\s+/g, ' ');
  summary = summary.trim();

  if (summary.length < 100) {
    const category = categorizeArticle(article);
    const generalDescriptions = {
      'Diagnostics': 'This article discusses how artificial intelligence is being used to improve medical diagnosis, enabling earlier detection and more accurate identification of diseases.',
      'Surgery': 'This article explores the use of AI and robotics in surgical procedures, improving precision and patient outcomes.',
      'Drug Discovery': 'This article covers how AI is accelerating drug discovery and development, helping identify new therapeutic compounds faster.',
      'Patient Care': 'This article examines how AI is enhancing patient care and treatment strategies in healthcare.',
      'Medical Imaging': 'This article discusses AI applications in medical imaging, improving the accuracy of radiology and diagnostic imaging.',
      'Clinical Decision Support': 'This article explores how AI is supporting clinical decision-making and improving healthcare workflows.',
      'Genomics': 'This article covers AI applications in genomics and personalized medicine.',
      'Public Health': 'This article discusses how AI is being used to improve public health outcomes and disease surveillance.'
    };

    summary = generalDescriptions[category] ||
              'This article discusses the latest developments in artificial intelligence applications in medicine and healthcare.';
  }

  if (summary.length > 500) {
    summary = summary.slice(0, 500);
    const lastPeriod = summary.lastIndexOf('.');
    if (lastPeriod > 300) {
      summary = summary.slice(0, lastPeriod + 1);
    } else {
      summary = summary.slice(0, 500) + '...';
    }
  }

  return summary;
}

function categorizeArticle(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();

  if (text.includes('diagnos') || text.includes('detect') || text.includes('screening')) return 'Diagnostics';
  if (text.includes('surgery') || text.includes('surgical') || text.includes('robot')) return 'Surgery';
  if (text.includes('drug') || text.includes('pharmaceutical') || text.includes('molecule')) return 'Drug Discovery';
  if (text.includes('treatment') || text.includes('therapy') || text.includes('patient')) return 'Patient Care';
  if (text.includes('imaging') || text.includes('mri') || text.includes('ct') || text.includes('x-ray') || text.includes('radiology')) return 'Medical Imaging';
  if (text.includes('clinical') || text.includes('ehr') || text.includes('electronic health')) return 'Clinical Decision Support';
  if (text.includes('genom') || text.includes('dna') || text.includes('gene')) return 'Genomics';
  if (text.includes('public health') || text.includes('epidemic') || text.includes('population')) return 'Public Health';

  return 'Diagnostics';
}

async function findImage(article) {
  try {
    const response = await axios.get(article.url, {
      timeout: 8000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && ogImage.startsWith('http')) {
      return ogImage;
    }

    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && twitterImage.startsWith('http')) {
      return twitterImage;
    }
  } catch (error) {
  }

  return STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
}

async function saveToSupabase(articles) {
  console.log('='.repeat(60));
  console.log('Saving to Supabase');
  console.log('='.repeat(60) + '\n');

  const { data: existing } = await supabase
    .from('medical_news')
    .select('source_url');

  const existingUrls = new Set(existing?.map(e => e.source_url) || []);
  let saved = 0;
  let skipped = 0;

  for (const article of articles) {
    if (existingUrls.has(article.url)) {
      skipped++;
      continue;
    }

    const summary = createSummary(article);
    const category = categorizeArticle(article);
    const image_url = await findImage(article);

    console.log(`[${saved + 1}/${articles.length}] ${article.title.slice(0, 60)}...`);

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
      console.error(`  ERROR: ${error.message}`);
    } else {
      saved++;
      console.log(`  ✓ Saved`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nResults: ${saved} saved, ${skipped} skipped\n`);
}

async function cleanupOld() {
  console.log('='.repeat(60));
  console.log('Cleanup');
  console.log('='.repeat(60) + '\n');

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
      console.log(`Deleted ${toDelete.length} old articles\n`);
    }
  } else {
    console.log('No cleanup needed\n');
  }
}

async function main() {
  try {
    const allArticles = await gatherArticles();

    if (allArticles.length === 0) {
      console.error('ERROR: No articles found!');
      process.exit(1);
    }

    const top15 = selectTop15(allArticles);
    await saveToSupabase(top15);
    await cleanupOld();

    console.log('='.repeat(60));
    console.log('✓ Crawler Completed Successfully');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ CRAWLER FAILED');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

main();
