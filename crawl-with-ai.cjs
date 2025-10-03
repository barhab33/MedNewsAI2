const { Client } = require('pg');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');

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

const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    free: true,
    requestsPerMinute: 60
  },
  groq: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'mixtral-8x7b-32768',
    free: true,
    requestsPerMinute: 30
  }
};

let currentProvider = 'gemini';
let requestCount = { gemini: 0, groq: 0 };
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

async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    $('script, style, nav, header, footer, iframe, .ad, .advertisement').remove();

    const content = $('article, .article-content, .post-content, main, .content, body')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);

    return content.length > 100 ? content : null;
  } catch (error) {
    console.log(`    ⚠️  Could not fetch content: ${error.message}`);
    return null;
  }
}

async function generateSummaryWithGemini(title, content, category) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log(`    ⚠️  No Gemini API key found`);
      return null;
    }

    const prompt = `You are a medical AI news editor. Write a concise, engaging 2-3 sentence summary of this article about AI in healthcare.

Title: ${title}
Category: ${category}
Content: ${content.substring(0, 2000)}

Write ONLY the summary, no preamble. Focus on the key medical/AI advancement and its significance.`;

    const response = await axios.post(
      `${AI_PROVIDERS.gemini.endpoint}?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 15000 }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (summary && summary.length > 50) {
      return summary;
    }
    return null;
  } catch (error) {
    console.log(`    ❌ Gemini failed: ${error.message}`);
    return null;
  }
}

async function generateSummaryWithGroq(title, content, category) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log(`    ⚠️  No Groq API key found`);
      return null;
    }

    const prompt = `You are a medical AI news editor. Write a concise, engaging 2-3 sentence summary of this article about AI in healthcare.

Title: ${title}
Category: ${category}
Content: ${content.substring(0, 2000)}

Write ONLY the summary, no preamble. Focus on the key medical/AI advancement and its significance.`;

    const response = await axios.post(
      AI_PROVIDERS.groq.endpoint,
      {
        model: AI_PROVIDERS.groq.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const summary = response.data?.choices?.[0]?.message?.content?.trim();
    if (summary && summary.length > 50) {
      return summary;
    }
    return null;
  } catch (error) {
    console.log(`    ❌ Groq failed: ${error.message}`);
    return null;
  }
}

function getFallbackSummary(title, category) {
  const templates = {
    'Diagnostics': `New AI diagnostic breakthrough shows promise in improving early disease detection and clinical decision-making accuracy.`,
    'Medical Imaging': `Advanced AI imaging technology demonstrates enhanced precision in medical image analysis and diagnostic capabilities.`,
    'Surgery': `AI-powered surgical systems advance precision medicine with improved patient outcomes and reduced complications.`,
    'Drug Discovery': `Machine learning accelerates pharmaceutical development, potentially bringing new treatments to patients faster.`,
    'Clinical Trials': `AI technology optimizes clinical trial efficiency, improving patient recruitment and research outcomes.`,
    'Research': `Groundbreaking research demonstrates AI's transformative potential in healthcare and medical practice.`
  };

  return templates[category] || templates['Research'];
}

async function generateAISummary(title, content, category) {
  if (!content || content.length < 100) {
    console.log(`    ⚠️  Using fallback (no content)`);
    return getFallbackSummary(title, category);
  }

  if (Date.now() - lastResetTime > 60000) {
    requestCount = { gemini: 0, groq: 0 };
    lastResetTime = Date.now();
  }

  const providers = ['gemini', 'groq'];

  for (const provider of providers) {
    if (requestCount[provider] >= AI_PROVIDERS[provider].requestsPerMinute) {
      console.log(`    ⏭️  Skipping ${AI_PROVIDERS[provider].name} (rate limit)`);
      continue;
    }

    console.log(`    🤖 Generating with ${AI_PROVIDERS[provider].name}...`);

    let summary = null;
    if (provider === 'gemini') {
      summary = await generateSummaryWithGemini(title, content, category);
    } else if (provider === 'groq') {
      summary = await generateSummaryWithGroq(title, content, category);
    }

    if (summary) {
      requestCount[provider]++;
      console.log(`    ✓ Generated AI summary`);
      return summary;
    }
  }

  console.log(`    ⚠️  All AI providers failed, using fallback`);
  return getFallbackSummary(title, category);
}

async function generateDetailedContent(title, summary, category, source, content) {
  if (!content || content.length < 100) {
    const context = `This development, reported by ${source}, highlights the rapid advancement of artificial intelligence in healthcare.`;
    const implications = `AI technology continues to transform medical practice across specialties, from diagnostics to treatment planning.`;
    const future = `As these technologies mature, collaboration between technologists and clinicians will be essential to realizing AI's full potential in medicine.`;

    return `${summary}\n\n${context}\n\n${implications}\n\n${future}`;
  }

  const providers = ['gemini', 'groq'];

  for (const provider of providers) {
    if (requestCount[provider] >= AI_PROVIDERS[provider].requestsPerMinute - 1) {
      continue;
    }

    try {
      let detailedContent = null;

      const prompt = `You are a medical AI news editor. Write a detailed 3-4 paragraph article based on this information.

Title: ${title}
Summary: ${summary}
Category: ${category}
Source: ${source}
Content: ${content.substring(0, 2500)}

Write a comprehensive article that:
1. Expands on the key points
2. Explains the medical/AI significance
3. Discusses potential implications
4. Mentions future outlook

Write in a professional but accessible tone. No preamble, just the article content.`;

      if (provider === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) continue;
        const response = await axios.post(
          `${AI_PROVIDERS.gemini.endpoint}?key=${apiKey}`,
          {
            contents: [{
              parts: [{ text: prompt }]
            }]
          },
          { timeout: 20000 }
        );
        detailedContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      } else if (provider === 'groq') {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) continue;
        const response = await axios.post(
          AI_PROVIDERS.groq.endpoint,
          {
            model: AI_PROVIDERS.groq.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 800
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );
        detailedContent = response.data?.choices?.[0]?.message?.content?.trim();
      }

      if (detailedContent && detailedContent.length > 200) {
        requestCount[provider]++;
        return detailedContent;
      }
    } catch (error) {
      console.log(`    ⚠️  Detailed content generation failed with ${provider}`);
    }
  }

  const context = `This development, reported by ${source}, highlights the rapid advancement of artificial intelligence in healthcare.`;
  const implications = `AI technology continues to transform medical practice across specialties, from diagnostics to treatment planning.`;
  const future = `As these technologies mature, collaboration between technologists and clinicians will be essential to realizing AI's full potential in medicine.`;

  return `${summary}\n\n${context}\n\n${implications}\n\n${future}`;
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

async function crawlGoogleNews() {
  const articles = [];
  const seenTitles = new Set();

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

        const articleContent = await fetchArticleContent(item.link);
        await new Promise(resolve => setTimeout(resolve, 500));

        const summary = await generateAISummary(cleanedTitle, articleContent, category);
        await new Promise(resolve => setTimeout(resolve, 500));

        const content = await generateDetailedContent(cleanedTitle, summary, category, source, articleContent);

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
  console.log('🚀 Starting AI-Powered Medical News Crawler\n');
  console.log('🤖 Using free AI providers: Google Gemini + Groq\n');

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
