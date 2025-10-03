const { Client } = require('pg');
const https = require('https');

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

function generateRichSummary(title, category, source) {
  const cleanedTitle = cleanTitle(title);

  const summaries = {
    'Diagnostics': [
      `New AI diagnostic system shows promising results in early disease detection. ${cleanedTitle} represents a significant advancement in medical diagnostics, with potential to improve patient outcomes through earlier intervention.`,
      `Breakthrough in AI-powered diagnostics enhances accuracy and speed. ${cleanedTitle} demonstrates how machine learning can augment clinical decision-making and reduce diagnostic errors.`,
      `Advanced artificial intelligence transforms diagnostic capabilities. ${cleanedTitle} showcases cutting-edge technology that could revolutionize how doctors identify and treat diseases.`
    ],
    'Medical Imaging': [
      `Revolutionary AI imaging technology improves diagnostic precision. ${cleanedTitle} leverages deep learning to analyze medical images with unprecedented accuracy, potentially saving lives through faster diagnosis.`,
      `Artificial intelligence enhances radiology workflow and accuracy. ${cleanedTitle} represents major progress in automated image analysis, helping radiologists detect abnormalities earlier.`,
      `New machine learning model transforms medical imaging analysis. ${cleanedTitle} demonstrates how AI can assist healthcare professionals in interpreting complex imaging data.`
    ],
    'Surgery': [
      `AI-powered surgical robotics advance precision medicine. ${cleanedTitle} shows how intelligent systems are enhancing surgical outcomes and reducing complications.`,
      `Breakthrough in robotic surgery supported by artificial intelligence. ${cleanedTitle} represents the next generation of surgical technology, improving patient safety and recovery times.`,
      `Machine learning optimizes surgical planning and execution. ${cleanedTitle} demonstrates innovative applications of AI in the operating room.`
    ],
    'Drug Discovery': [
      `Artificial intelligence accelerates pharmaceutical development. ${cleanedTitle} showcases how machine learning is revolutionizing the drug discovery process, potentially bringing new treatments to patients faster.`,
      `AI-driven drug discovery platform identifies promising candidates. ${cleanedTitle} represents a major advancement in computational pharmacology and personalized medicine.`,
      `Machine learning transforms traditional drug development pipeline. ${cleanedTitle} demonstrates how AI can reduce costs and timeframes in bringing new therapies to market.`
    ],
    'Clinical Trials': [
      `AI technology optimizes clinical trial design and execution. ${cleanedTitle} shows how intelligent systems are improving patient recruitment, monitoring, and outcomes in medical research.`,
      `Machine learning enhances clinical research efficiency. ${cleanedTitle} demonstrates innovative approaches to accelerating medical breakthroughs through better trial management.`,
      `Artificial intelligence transforms patient matching and trial protocols. ${cleanedTitle} represents significant progress in making clinical research more effective and accessible.`
    ],
    'Research': [
      `Groundbreaking research demonstrates AI's potential in healthcare. ${cleanedTitle} contributes to our understanding of how machine learning can transform medical practice.`,
      `New study showcases artificial intelligence applications in medicine. ${cleanedTitle} represents important progress in developing AI-powered healthcare solutions.`,
      `Researchers unveil innovative AI healthcare technology. ${cleanedTitle} demonstrates cutting-edge approaches to improving patient care through intelligent systems.`
    ]
  };

  const categoryTemplates = summaries[category] || summaries['Research'];
  const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

  return template;
}

function generateDetailedContent(title, summary, category, source) {
  const cleanedTitle = cleanTitle(title);

  const intro = summary;

  const context = `This development, reported by ${source}, highlights the rapid advancement of artificial intelligence in healthcare. ` +
    `As AI technology matures, we're seeing increasingly sophisticated applications across medical specialties, ` +
    `from improving diagnostic accuracy to optimizing treatment protocols.`;

  const implications = category === 'Diagnostics'
    ? `The implications for diagnostic medicine are profound. AI systems can analyze vast amounts of patient data in seconds, identifying patterns that might take human clinicians much longer to detect. This technology has the potential to catch diseases earlier, when they're most treatable, and reduce healthcare costs by minimizing unnecessary tests.`
    : category === 'Drug Discovery'
    ? `For pharmaceutical development, AI offers unprecedented opportunities to accelerate the discovery process. Traditional drug development can take over a decade and cost billions. Machine learning models can screen millions of compounds virtually, predict drug interactions, and identify promising candidates much faster than conventional methods.`
    : category === 'Surgery'
    ? `In surgical applications, AI-powered robotics provide enhanced precision, reduce human error, and enable minimally invasive procedures. These systems can analyze patient data in real-time during operations, providing surgeons with critical insights and decision support that improve patient outcomes.`
    : `This research contributes to a growing body of evidence demonstrating AI's transformative potential in healthcare. As these technologies continue to evolve, they promise to make medical care more personalized, accessible, and effective for patients worldwide.`;

  const future = `Looking ahead, the integration of AI in healthcare will likely accelerate, with more institutions adopting these technologies. ` +
    `However, challenges remain around regulatory approval, data privacy, clinical validation, and ensuring these tools augment rather than replace human expertise. ` +
    `Continued research, ethical guidelines, and collaboration between technologists and clinicians will be essential to realizing AI's full potential in medicine.`;

  return `${intro}\n\n${context}\n\n${implications}\n\n${future}`;
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

      for (const item of items.slice(0, 10)) {
        const cleanedTitle = cleanTitle(item.title);

        if (seenTitles.has(cleanedTitle) || cleanedTitle.length < 20) {
          continue;
        }

        seenTitles.add(cleanedTitle);

        const source = extractSourceFromTitle(item.title);
        const category = categorizeArticle(cleanedTitle);
        const summary = generateRichSummary(item.title, category, source);
        const content = generateDetailedContent(item.title, summary, category, source);

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

        if (articles.length >= 50) break;
      }

      if (articles.length >= 50) break;

      await new Promise(resolve => setTimeout(resolve, 1500));
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
      console.log(`  ✓ [${article.category}] ${article.title.substring(0, 55)}... (${article.originalSource})`);
    } catch (error) {
      console.error(`  ❌ Error saving article:`, error.message);
    }
  }

  console.log(`\n✅ Saved ${saved} new articles (${duplicates} duplicates skipped)`);

  const total = await client.query('SELECT COUNT(*) FROM medical_news');
  console.log(`📊 Total articles in database: ${total.rows[0].count}`);
}

async function main() {
  console.log('🚀 Starting Multi-Source Medical AI News Crawler\n');

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