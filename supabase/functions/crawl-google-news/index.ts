import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_NEWS_QUERIES = [
  'artificial intelligence healthcare breakthrough',
  'AI medical diagnosis',
  'machine learning drug discovery',
  'AI radiology imaging',
  'deep learning cancer detection',
  'AI surgical robotics',
  'medical AI FDA approval',
  'AI clinical trials',
];

async function generateWithGemini(apiKey: string, title: string, category: string, source: string, type: string = 'summary'): Promise<string | null> {
  try {
    const summaryPrompt = `You are a medical AI news editor. Based ONLY on this title, write a compelling 2-3 sentence summary.

Title: "${title}"
Category: ${category}
Source: ${source}

Write a natural, specific summary that:
- Sounds concrete and informative (infer details from the title)
- Mentions specific elements from the title
- Avoids generic phrases like "highlights advancement"
- Write ONLY the summary, no preamble.`;

    const contentPrompt = `You are a medical AI news editor. Expand this into a detailed 3-paragraph article.

Title: "${title}"
Category: ${category}
Source: ${source}

Write 3 well-developed paragraphs that sound authoritative and specific. No preamble:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: type === 'summary' ? summaryPrompt : contentPrompt }]
          }]
        })
      }
    );

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

function createFallback(title: string, category: string, source: string): string {
  const cleanTitle = title.replace(/\s*\.\.\.$/, '').trim();
  const lowerCategory = category.toLowerCase();
  return `${cleanTitle} ${source} reports on this development in AI-assisted ${lowerCategory}.`;
}

async function searchGoogleNews(query: string): Promise<any[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await fetch(url);
    const xml = await response.text();

    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = xml.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link');
      const pubDate = extractTag(itemXml, 'pubDate');
      const source = extractTag(itemXml, 'source');

      if (title && link) {
        items.push({ title, link, pubDate, source: source || 'News Source' });
      }
    }

    return items;
  } catch (error) {
    console.error('Google News search error:', error);
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';

  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function categorizeArticle(title: string): string {
  const text = title.toLowerCase();

  if (text.includes('diagnos') || text.includes('detect') || text.includes('screen')) return 'Diagnostics';
  if (text.includes('surg') || text.includes('robot') || text.includes('operat')) return 'Surgery';
  if (text.includes('drug') || text.includes('pharma') || text.includes('treatment')) return 'Drug Discovery';
  if (text.includes('imag') || text.includes('mri') || text.includes('scan') || text.includes('radiolog')) return 'Medical Imaging';
  if (text.includes('trial') || text.includes('study')) return 'Clinical Trials';
  if (text.includes('patient') || text.includes('care') || text.includes('hospital')) return 'Patient Care';

  return 'Research';
}

function getDefaultImage(category: string): string {
  const imageMap: Record<string, string> = {
    "Diagnostics": "https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg",
    "Surgery": "https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg",
    "Drug Discovery": "https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg",
    "Medical Imaging": "https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg",
    "Clinical Trials": "https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg",
    "Patient Care": "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg",
    "Research": "https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg"
  };

  return imageMap[category] || imageMap["Research"];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting medical AI news crawl from Google News...");
    console.log(`Gemini API: ${geminiKey ? 'Enabled' : 'Disabled'}`);

    const allArticles: any[] = [];

    for (const query of GOOGLE_NEWS_QUERIES) {
      console.log(`Searching: ${query}`);
      const results = await searchGoogleNews(query);

      for (const item of results.slice(0, 5)) {
        const category = categorizeArticle(item.title);

        let summary = null;
        let content = null;

        if (geminiKey) {
          summary = await generateWithGemini(geminiKey, item.title, category, item.source, 'summary');
          await new Promise(resolve => setTimeout(resolve, 500));
          content = await generateWithGemini(geminiKey, item.title, category, item.source, 'content');
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!summary) summary = createFallback(item.title, category, item.source);
        if (!content) content = createFallback(item.title, category, item.source);

        allArticles.push({
          title: item.title,
          summary,
          content,
          source: 'MedNewsAI Editorial Team',
          source_url: item.link,
          original_source: item.source,
          category,
          image_url: getDefaultImage(category),
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        });
      }
    }

    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.source_url, item])).values()
    );

    console.log(`Found ${uniqueArticles.length} unique articles`);

    let insertedCount = 0;
    for (const article of uniqueArticles) {
      const { error } = await supabase
        .from("medical_news")
        .upsert(article, { onConflict: "source_url", ignoreDuplicates: true });

      if (!error || error.message.includes("duplicate")) {
        insertedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully crawled and stored ${insertedCount} articles`,
        total_found: uniqueArticles.length,
        inserted: insertedCount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Crawl error:", error);
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
