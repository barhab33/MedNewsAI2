// Skip dotenv in CI environments - use environment variables directly
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available
  }
}
const https = require('https');
const axios = require('axios');
const { Client } = require('pg');

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Medical AI search queries - focused on breakthroughs
const PUBMED_QUERIES = [
  'artificial intelligence breakthrough medicine',
  'AI breakthrough healthcare',
  'machine learning breakthrough diagnosis',
  'deep learning breakthrough cancer',
  'AI drug discovery breakthrough',
  'artificial intelligence precision medicine',
  'AI breakthrough surgical',
  'machine learning breakthrough treatment',
  'AI medical imaging innovation',
  'artificial intelligence clinical breakthrough'
];

// Fetch from PubMed
async function searchPubMed(query, maxResults = 10) {
  return new Promise((resolve, reject) => {
    const encodedQuery = query.replace(/ /g, '+');
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmax=${maxResults}&retmode=json&sort=date&reldate=60`;

    https.get(searchUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const ids = json.esearchresult?.idlist || [];

          if (ids.length === 0) {
            resolve([]);
            return;
          }

          const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;

          https.get(fetchUrl, (fetchRes) => {
            let xmlData = '';
            fetchRes.on('data', chunk => xmlData += chunk);
            fetchRes.on('end', () => {
              const articles = parsePubMedXML(xmlData);
              resolve(articles);
            });
          }).on('error', reject);

        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function parsePubMedXML(xml) {
  const articles = [];
  const articleMatches = xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g);

  for (const match of articleMatches) {
    const articleXml = match[1];

    const pmid = extractTag(articleXml, 'PMID');
    const title = extractTag(articleXml, 'ArticleTitle');
    const abstractText = extractTag(articleXml, 'AbstractText');
    const journal = extractTag(articleXml, 'Title');
    const pubDate = extractPubDate(articleXml);

    if (title && pmid && abstractText && abstractText.length > 100) {
      articles.push({
        pmid,
        title: cleanText(title),
        abstract: cleanText(abstractText),
        journal: cleanText(journal || 'PubMed'),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        publishedAt: pubDate
      });
    }
  }

  return articles;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function extractPubDate(xml) {
  const year = extractTag(xml, 'Year') || new Date().getFullYear();
  const month = extractTag(xml, 'Month') || '01';
  const day = extractTag(xml, 'Day') || '01';

  const monthNum = isNaN(month) ? '01' : month.padStart(2, '0');
  const dayNum = day.padStart(2, '0');

  return `${year}-${monthNum}-${dayNum}`;
}

function cleanText(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function categorizeArticle(title, abstract) {
  const text = `${title} ${abstract}`.toLowerCase();

  const categories = [
    { name: 'Diagnostics', keywords: ['diagnosis', 'diagnostic', 'detection', 'screening', 'predict', 'classification'] },
    { name: 'Surgery', keywords: ['surgery', 'surgical', 'robotic', 'operation', 'procedure', 'intervention'] },
    { name: 'Drug Discovery', keywords: ['drug', 'pharmaceutical', 'molecule', 'compound', 'therapy', 'treatment'] },
    { name: 'Medical Imaging', keywords: ['imaging', 'mri', 'ct scan', 'x-ray', 'radiology', 'ultrasound', 'scan'] },
    { name: 'Patient Care', keywords: ['patient', 'care', 'outcome', 'monitoring', 'clinical practice'] },
    { name: 'Research', keywords: ['study', 'research', 'analysis', 'investigation', 'framework'] }
  ];

  let bestCategory = 'Research';
  let maxScore = 0;

  for (const category of categories) {
    const score = category.keywords.filter(keyword => text.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category.name;
    }
  }

  return bestCategory;
}

async function generateWithAI(title, abstract, journal) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      summary: abstract.split(/[.!?]+/).slice(0, 2).join('. ').trim() + '.',
      content: abstract
    };
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are a medical AI news writer. Create a compelling article from this research abstract.

Title: ${title}
Journal: ${journal}
Abstract: ${abstract}

Write:
1. A 2-3 sentence engaging summary (conversational, specific, avoid generic phrases)
2. A 3-paragraph article that:
   - Explains the research significance and findings
   - Details the methodology and AI/ML techniques used
   - Discusses implications for healthcare and future directions

Format: Return ONLY JSON with keys "summary" and "content". No markdown, no code blocks.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 20000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return result;
        }
      }
    }
  } catch (error) {
    console.log(`    ⚠️  AI generation failed: ${error.message}`);
  }

  // Fallback
  return {
    summary: abstract.split(/[.!?]+/).slice(0, 2).join('. ').trim() + '.',
    content: abstract
  };
}

function getDefaultImage(category) {
  const imageMap = {
    'Diagnostics': 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Surgery': 'https://images.pexels.com/photos/2324837/pexels-photo-2324837.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Drug Discovery': 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Medical Imaging': 'https://images.pexels.com/photos/7089170/pexels-photo-7089170.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Patient Care': 'https://images.pexels.com/photos/7088526/pexels-photo-7088526.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Research': 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800'
  };

  return imageMap[category] || imageMap['Research'];
}

async function main() {
  console.log('🚀 Starting Medical AI News Crawler\n');
  console.log('📚 Sources: PubMed (peer-reviewed research)\n');

  await client.connect();
  console.log('✓ Connected to database\n');

  // Clear old articles
  await client.query('DELETE FROM medical_news');
  console.log('✓ Cleared old articles\n');

  let totalArticles = 0;
  let processedCount = 0;

  for (const query of PUBMED_QUERIES) {
    console.log(`🔍 Searching: "${query}"...`);

    try {
      const articles = await searchPubMed(query, 10);
      console.log(`  Found ${articles.length} articles\n`);

      for (const article of articles) {
        const category = categorizeArticle(article.title, article.abstract);

        console.log(`  📰 ${article.title.substring(0, 70)}...`);
        console.log(`     [${category}] ${article.journal}`);

        const { summary, content } = await generateWithAI(
          article.title,
          article.abstract,
          article.journal
        );

        try {
          const result = await client.query(
            `INSERT INTO medical_news (title, summary, content, source, source_url, original_source, category, image_url, published_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (source_url) DO NOTHING
             RETURNING id`,
            [
              article.title,
              summary,
              content,
              'MedNewsAI Editorial Team',
              article.url,
              article.journal,
              category,
              getDefaultImage(category),
              article.publishedAt
            ]
          );

          if (result.rows.length > 0) {
            totalArticles++;
            console.log('     ✓ Saved\n');
          } else {
            console.log('     ⊘ Duplicate skipped\n');
          }
        } catch (error) {
          console.log(`     ✗ Error: ${error.message}\n`);
        }

        processedCount++;

        // Rate limiting
        if (processedCount % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Delay between queries
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`  ✗ Query failed: ${error.message}\n`);
    }
  }

  const result = await client.query('SELECT COUNT(*) FROM medical_news');

  console.log('==============================');
  console.log(`✅ Crawl complete!`);
  console.log(`📊 Total articles in database: ${result.rows[0].count}`);
  console.log(`📝 New articles added: ${totalArticles}`);
  console.log('==============================');

  await client.end();
}

main().catch(console.error);
