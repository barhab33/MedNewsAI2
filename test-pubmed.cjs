const https = require('https');
const { Client } = require('pg');

async function searchPubMed(query, maxResults = 5) {
  return new Promise((resolve, reject) => {
    const encodedQuery = query.replace(/ /g, '+');
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmax=${maxResults}&retmode=json&sort=date`;

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

    if (title && pmid) {
      articles.push({
        pmid,
        title: cleanText(title),
        abstract: cleanText(abstractText || title),
        journal: cleanText(journal || 'PubMed'),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
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

  const categoryKeywords = {
    'diagnostics': ['diagnosis', 'diagnostic', 'detection', 'screening', 'identify', 'predict'],
    'surgery': ['surgery', 'surgical', 'robotic', 'operation', 'procedure'],
    'drug-discovery': ['drug', 'pharmaceutical', 'molecule', 'compound', 'therapy', 'treatment'],
    'imaging': ['imaging', 'mri', 'ct scan', 'x-ray', 'radiology', 'ultrasound'],
    'genomics': ['genomic', 'genetic', 'dna', 'gene', 'sequencing'],
    'research': ['study', 'research', 'analysis', 'investigation', 'clinical']
  };

  let bestCategory = 'research';
  let maxScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter(keyword => text.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function generateSummary(title, abstract) {
  if (!abstract || abstract.length < 50) {
    return `A recent study explores ${title.toLowerCase()}. This research represents important progress in understanding how artificial intelligence can be applied to medical challenges.`;
  }

  const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length === 0) return abstract.substring(0, 200);

  return sentences.slice(0, 2).join('. ').trim() + '.';
}

function generateContent(title, abstract, journal) {
  const summary = generateSummary(title, abstract);

  return `${summary}

According to research published in ${journal}, this development showcases the growing capabilities of artificial intelligence in transforming medical practice. The findings contribute to a broader understanding of how machine learning and AI systems can enhance healthcare delivery, improve patient outcomes, and accelerate medical research.

The study's implications extend across multiple areas of medicine, from improving diagnostic accuracy to optimizing treatment protocols. As AI technology continues to advance, such research plays a crucial role in shaping the future of healthcare.

This work adds to the growing body of evidence demonstrating AI's potential to address complex medical challenges and support healthcare professionals in delivering better patient care.`;
}

function getDefaultImage(category) {
  const imageMap = {
    'diagnostics': 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
    'surgery': 'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg',
    'drug-discovery': 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg',
    'imaging': 'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg',
    'genomics': 'https://images.pexels.com/photos/3825456/pexels-photo-3825456.jpeg',
    'research': 'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg'
  };

  return imageMap[category] || imageMap['research'];
}

async function main() {
  console.log('Starting PubMed crawler...');

  const client = new Client({
    host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: '8ZKt+2D2_2s4fyE',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to database');

  const queries = [
    'artificial intelligence medicine',
    'machine learning diagnosis',
    'deep learning medical imaging'
  ];

  let totalInserted = 0;

  for (const query of queries) {
    console.log(`\nSearching for: "${query}"...`);
    const articles = await searchPubMed(query, 5);
    console.log(`Found ${articles.length} articles`);

    for (const article of articles) {
      const category = categorizeArticle(article.title, article.abstract);
      const summary = generateSummary(article.title, article.abstract);
      const content = generateContent(article.title, article.abstract, article.journal);

      try {
        await client.query(
          `INSERT INTO medical_news (title, summary, content, source, source_url, original_source, category, image_url, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (source_url) DO NOTHING`,
          [
            article.title,
            summary,
            content,
            'MedNewsAI Editorial Team',
            article.url,
            article.journal,
            category,
            getDefaultImage(category),
            new Date().toISOString()
          ]
        );
        totalInserted++;
        console.log(`  ✓ ${article.title.substring(0, 60)}...`);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const result = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log(`\n✓ Crawl complete! Total articles in database: ${result.rows[0].count}`);
  console.log(`✓ New articles added: ${totalInserted}`);

  await client.end();
}

main().catch(console.error);