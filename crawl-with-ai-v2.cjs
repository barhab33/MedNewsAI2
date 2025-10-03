const { Client } = require('pg');
const https = require('https');
const axios = require('axios');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const GOOGLE_NEWS_QUERIES = [
  'artificial intelligence healthcare breakthrough',
  'AI medical diagnosis',
  'machine learning drug discovery',
  'AI radiology imaging',
  'deep learning cancer detection',
  'AI surgical robotics',
  'medical AI FDA approval',
  'AI clinical trials',
  'healthcare AI research',
  'medical AI technology',
];

let requestCount = 0;
let lastResetTime = Date.now();

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                   item.match(/<title>(.*?)<\/title>/))?.[1] || '';

    const link = (item.match(/<link>(.*?)<\/link>/) ||
                  item.match(/<guid[^>]*>(.*?)<\/guid>/))?.[1] || '';

    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || new Date().toISOString();

    if (title && link) {
      items.push({ title: title.trim(), link: link.trim(), pubDate });
    }
  }

  return items;
}

async function generateSummaryWithAI(title, category, source) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (Date.now() - lastResetTime > 60000) {
    requestCount = 0;
    lastResetTime = Date.now();
  }

  if (requestCount >= 60) {
    console.log(`    ⏭️  Rate limit reached`);
    return null;
  }

  try {
    const prompt = `You are a medical AI news editor. Based ONLY on this title and metadata, write a compelling 2-3 sentence summary that sounds specific and informative (not generic).

Title: "${title}"
Category: ${category}
Source: ${source}

Write a natural summary that:
- Sounds like you know the specific details (even though you're inferring from the title)
- Mentions concrete elements from the title
- Avoids generic phrases like "highlights advancement" or "demonstrates potential"
- Sounds like real medical news

Example of GOOD summary (specific, concrete):
"Stanford researchers developed an AI system that analyzes retinal scans to predict cardiovascular disease risk up to five years before symptoms appear. The deep learning model achieved 85% accuracy in clinical trials across 12,000 patients. This breakthrough could enable preventive interventions and reduce heart disease mortality."

Example of BAD summary (too generic):
"This development highlights the rapid advancement of AI in healthcare and demonstrates significant potential for improving patient outcomes through innovative technology."

Now write ONLY the summary for the article title above:`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 15000 }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (summary && summary.length > 50) {
      requestCount++;
      console.log(`    ✓ AI generated summary`);
      return summary;
    }
    return null;
  } catch (error) {
    console.log(`    ❌ AI failed: ${error.message}`);
    return null;
  }
}

async function generateDetailedContentWithAI(title, summary, category, source) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || requestCount >= 59) {
    return createFallbackContent(summary);
  }

  try {
    const prompt = `You are a medical AI news editor. Expand this summary into a detailed 3-paragraph article.

Title: "${title}"
Summary: ${summary}
Category: ${category}
Source: ${source}

Write a comprehensive article that:
- Expands on the specific details mentioned in the summary
- Adds context about why this matters for healthcare/patients
- Discusses practical implications or next steps
- Uses concrete, specific language (avoid vague phrases)
- Sounds authoritative but accessible

Write 3 well-developed paragraphs. No preamble, just the article:`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 20000 }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (content && content.length > 200) {
      requestCount++;
      return content;
    }
    return createFallbackContent(summary);
  } catch (error) {
    console.log(`    ⚠️  Detailed content generation failed`);
    return createFallbackContent(summary);
  }
}

function createFallbackContent(summary) {
  return summary;
}

function extractSourceFromTitle(title) {
  const match = title.match(/ - ([^-]+)$/);
  if (match) {
    const source = match[1].trim();
    if (source && source.length < 50 && !source.includes('http')) {
      return source;
    }
  }

  const sources = ['Nature', 'Science', 'MIT News', 'Stanford', 'NIH', 'FDA', 'Google', 'DeepMind',
                   'JAMA', 'Lancet', 'NEJM', 'Forbes', 'Reuters', 'BBC', 'CNN Health', 'Harvard',
                   'Johns Hopkins', 'Mayo Clinic', 'Cleveland Clinic', 'Wired', 'TechCrunch'];
  for (const source of sources) {
    if (title.toLowerCase().includes(source.toLowerCase())) {
      return source;
    }
  }

  return 'Medical News Network';
}

function cleanTitle(title) {
  const match = title.match(/^(.*?)\s*-\s*[^-]+$/);
  if (match && match[1].length > 20) {
    return match[1].trim();
  }
  return title;
}

function categorizeArticle(title) {
  const text = title.toLowerCase();

  if (text.match(/diagnos|detect|screen|identif/)) return 'Diagnostics';
  if (text.match(/imag|scan|x-ray|mri|ct|radiolog/)) return 'Medical Imaging';
  if (text.match(/surg|operat|robot/)) return 'Surgery';
  if (text.match(/drug|pharmac|compound|molecul|discover/)) return 'Drug Discovery';
  if (text.match(/genom|dna|gene|sequenc/)) return 'Genomics';
  if (text.match(/patient|care|treatment|therap/)) return 'Patient Care';
  if (text.match(/trial|clinic|study/)) return 'Clinical Trials';
  if (text.match(/telemed|remote|virtual|digital health/)) return 'Telemedicine';

  return 'Research';
}

function createSmartFallbackSummary(title, category, source) {
  const cleanedTitle = cleanTitle(title);
  const lowerTitle = cleanedTitle.toLowerCase();

  let summary = cleanedTitle;

  if (lowerTitle.includes('breakthrough') || lowerTitle.includes('advance')) {
    summary += ' This recent development from ' + source + ' represents notable progress in applying AI technology to clinical practice.';
  } else if (lowerTitle.includes('study') || lowerTitle.includes('research')) {
    summary += ' The research from ' + source + ' explores new applications of machine learning in medical contexts.';
  } else if (lowerTitle.includes('fda') || lowerTitle.includes('approval')) {
    summary += ' This regulatory milestone marks another step forward in bringing AI medical devices to healthcare providers.';
  } else {
    summary += ' ' + source + ' reports on developments in AI-assisted ' + category.toLowerCase() + '.';
  }

  return summary;
}

async function crawlGoogleNews() {
  const articles = [];
  const seenTitles = new Set();
  const hasApiKey = !!process.env.GEMINI_API_KEY;

  if (!hasApiKey) {
    console.log('⚠️  No GEMINI_API_KEY found - will use smart fallback summaries\n');
  }

  for (const query of GOOGLE_NEWS_QUERIES) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

      console.log(`\n🔍 Searching: "${query}"...`);
      const xml = await fetchURL(url);
      const items = parseRSS(xml);

      console.log(`  Found ${items.length} articles`);

      for (const item of items.slice(0, 5)) {
        const cleanedTitle = cleanTitle(item.title);

        if (seenTitles.has(cleanedTitle) || cleanedTitle.length < 20) {
          continue;
        }

        seenTitles.add(cleanedTitle);

        const source = extractSourceFromTitle(item.title);
        const category = categorizeArticle(cleanedTitle);

        console.log(`\n  📰 ${cleanedTitle.substring(0, 60)}...`);
        console.log(`     Category: ${category} | Source: ${source}`);

        let summary;
        if (hasApiKey) {
          summary = await generateSummaryWithAI(cleanedTitle, category, source);
          if (!summary) {
            summary = createSmartFallbackSummary(cleanedTitle, category, source);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          summary = createSmartFallbackSummary(cleanedTitle, category, source);
        }

        let content;
        if (hasApiKey && requestCount < 58) {
          content = await generateDetailedContentWithAI(cleanedTitle, summary, category, source);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          content = createFallbackContent(summary);
        }

        const imageMap = {
          'Diagnostics': 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
          'Medical Imaging': 'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg',
          'Surgery': 'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg',
          'Drug Discovery': 'https://images.pexels.com/photos/3825388/pexels-photo-3825388.jpeg',
          'Genomics': 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg',
          'Patient Care': 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg',
          'Clinical Trials': 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg',
          'Telemedicine': 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg',
          'Research': 'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg'
        };

        articles.push({
          title: cleanedTitle,
          summary,
          content,
          source: 'MedNewsAI Editorial Team',
          sourceUrl: item.link,
          originalSource: source,
          category,
          publishedAt: new Date(item.pubDate),
          imageUrl: imageMap[category] || imageMap['Research']
        });

        if (articles.length >= 30) break;
      }

      if (articles.length >= 30) break;

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  return articles;
}

async function saveToDatabase(articles) {
  console.log(`\n💾 Saving ${articles.length} articles to database...`);

  let saved = 0;
  let duplicates = 0;

  for (const article of articles) {
    try {
      const existing = await client.query(
        'SELECT id FROM medical_news WHERE source_url = $1',
        [article.sourceUrl]
      );

      if (existing.rows.length > 0) {
        duplicates++;
        continue;
      }

      await client.query(
        `INSERT INTO medical_news
        (title, summary, content, source, source_url, original_source, category, published_at, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          article.title,
          article.summary,
          article.content,
          article.source,
          article.sourceUrl,
          article.originalSource,
          article.category,
          article.publishedAt,
          article.imageUrl
        ]
      );

      saved++;
      console.log(`  ✓ [${article.category}] ${article.title.substring(0, 55)}...`);
    } catch (error) {
      console.error(`  ❌ Error saving article:`, error.message);
    }
  }

  console.log(`\n✅ Saved ${saved} new articles (${duplicates} duplicates skipped)`);

  const total = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log(`📊 Total articles in database: ${total.rows[0].count}`);
}

async function main() {
  console.log('🚀 Starting AI-Powered Medical News Crawler v2\n');

  await client.connect();
  console.log('✓ Connected to database\n');

  await client.query("DELETE FROM medical_news");
  console.log('✓ Cleared old articles\n');

  const articles = await crawlGoogleNews();

  if (articles.length > 0) {
    await saveToDatabase(articles);
  }

  await client.end();
  console.log('\n✅ Crawl complete!');
}

main().catch(console.error);
