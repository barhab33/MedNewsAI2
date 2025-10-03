import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsArticle {
  title: string;
  source: string;
  source_url: string;
  original_source: string;
  category: string;
  image_url: string;
  published_at: string;
  raw_content: string;
  processing_status: string;
}

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

const CATEGORY_KEYWORDS = {
  'Diagnostics': ['diagnosis', 'diagnostic', 'detection', 'screening', 'identify'],
  'Surgery': ['surgery', 'surgical', 'robotic', 'operation', 'procedure'],
  'Drug Discovery': ['drug', 'pharmaceutical', 'molecule', 'compound', 'therapy'],
  'Medical Imaging': ['imaging', 'mri', 'ct scan', 'x-ray', 'radiology'],
  'Patient Care': ['patient', 'care', 'treatment', 'hospital', 'clinic'],
  'Clinical Trials': ['trial', 'study', 'clinical', 'research'],
  'Research': ['research', 'study', 'investigation', 'analysis']
};

function categorizeArticle(title: string): string {
  const titleLower = title.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return category;
    }
  }

  return 'Research';
}

function getDefaultImage(category: string): string {
  const imageMap: Record<string, string> = {
    'Diagnostics': 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg',
    'Surgery': 'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg',
    'Drug Discovery': 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg',
    'Medical Imaging': 'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg',
    'Patient Care': 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg',
    'Clinical Trials': 'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg',
    'Research': 'https://images.pexels.com/photos/3825346/pexels-photo-3825346.jpeg'
  };

  return imageMap[category] || imageMap['Research'];
}

async function fetchGoogleNews(query: string): Promise<any[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(url);
    const xmlText = await response.text();

    return parseRSS(xmlText);
  } catch (error) {
    console.error(`Error fetching Google News for "${query}":`, error);
    return [];
  }
}

function parseRSS(xml: string): any[] {
  const articles: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const matches = xml.matchAll(itemRegex);

  for (const match of matches) {
    const itemXml = match[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const source = extractTag(itemXml, 'source');

    if (title && link) {
      articles.push({
        title: cleanText(title),
        link: cleanText(link),
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: cleanText(source) || 'Google News'
      });
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function cleanText(text: string): string {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting news fetch from Google News RSS...");

    const allArticles: NewsArticle[] = [];

    for (const query of GOOGLE_NEWS_QUERIES) {
      console.log(`Fetching: ${query}`);
      const results = await fetchGoogleNews(query);

      for (const article of results.slice(0, 2)) {
        const category = categorizeArticle(article.title);

        const newsArticle: NewsArticle = {
          title: article.title,
          source: 'MedNewsAI Editorial Team',
          source_url: article.link,
          original_source: article.source,
          category: category,
          image_url: getDefaultImage(category),
          published_at: article.pubDate,
          raw_content: article.title,
          processing_status: 'pending'
        };

        allArticles.push(newsArticle);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.source_url, item])).values()
    );

    console.log(`Found ${uniqueArticles.length} unique articles`);

    let insertedCount = 0;
    let queuedCount = 0;

    for (const article of uniqueArticles) {
      const { data: existingArticle } = await supabase
        .from('medical_news')
        .select('id')
        .eq('source_url', article.source_url)
        .maybeSingle();

      if (!existingArticle) {
        const { data: newArticle, error: insertError } = await supabase
          .from('medical_news')
          .insert(article)
          .select('id')
          .single();

        if (!insertError && newArticle) {
          insertedCount++;

          const { error: queueError } = await supabase
            .from('processing_queue')
            .insert({
              article_id: newArticle.id,
              status: 'pending',
              priority: 50
            });

          if (!queueError) {
            queuedCount++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully fetched and stored ${insertedCount} new articles`,
        total_found: uniqueArticles.length,
        inserted: insertedCount,
        queued_for_processing: queuedCount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
