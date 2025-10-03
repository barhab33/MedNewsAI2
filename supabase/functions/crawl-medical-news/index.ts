import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsItem {
  title: string;
  summary: string;
  content: string;
  source: string;
  source_url: string;
  original_source: string;
  category: string;
  image_url: string;
  published_at: string;
}

// Search PubMed for AI-related medical research
async function searchPubMed(query: string, maxResults: number = 10): Promise<any[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    // Fetch details for articles
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();

    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error("PubMed search error:", error);
    return [];
  }
}

function parsePubMedXML(xml: string): any[] {
  const articles: any[] = [];
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  const matches = xml.matchAll(articleRegex);

  for (const match of matches) {
    const articleXml = match[1];

    const pmid = extractTag(articleXml, "PMID");
    const title = extractTag(articleXml, "ArticleTitle");
    const abstractText = extractTag(articleXml, "AbstractText");
    const journal = extractTag(articleXml, "Title"); // Journal title
    const pubDate = extractPubDate(articleXml);

    if (title && pmid) {
      articles.push({
        pmid,
        title: cleanText(title),
        abstract: cleanText(abstractText || title),
        journal: cleanText(journal || "PubMed"),
        pubDate: pubDate,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      });
    }
  }

  return articles;
}

function extractPubDate(xml: string): string {
  const year = extractTag(xml, "Year");
  const month = extractTag(xml, "Month");
  const day = extractTag(xml, "Day");

  if (year) {
    const monthNum = month ? (isNaN(Number(month)) ? getMonthNumber(month) : month) : "01";
    const dayNum = day || "01";
    return new Date(`${year}-${monthNum}-${dayNum}`).toISOString();
  }

  return new Date().toISOString();
}

function getMonthNumber(month: string): string {
  const months: Record<string, string> = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12"
  };
  return months[month.toLowerCase().substring(0, 3)] || "01";
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function categorizeArticle(title: string, abstract: string): string {
  const text = `${title} ${abstract}`.toLowerCase();

  const categoryKeywords = {
    "diagnostics": ["diagnosis", "diagnostic", "detection", "screening", "identify", "predict", "early detection"],
    "surgery": ["surgery", "surgical", "robotic", "operation", "procedure", "intervention"],
    "drug-discovery": ["drug", "pharmaceutical", "molecule", "compound", "therapy", "treatment"],
    "imaging": ["imaging", "mri", "ct scan", "x-ray", "radiology", "ultrasound", "scan"],
    "genomics": ["genomic", "genetic", "dna", "gene", "sequencing", "crispr"],
    "research": ["study", "research", "analysis", "investigation", "clinical trial"]
  };

  let bestCategory = "research";
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

// Generate unique summary from abstract
function generateSummary(title: string, abstract: string): string {
  if (!abstract || abstract.length < 50) {
    return `A recent study published in a leading medical journal explores ${title.toLowerCase()}. This research represents important progress in understanding how artificial intelligence can be applied to medical challenges.`;
  }

  // Extract key findings and rephrase
  const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 20);

  if (sentences.length === 0) return abstract.substring(0, 200);

  // Take first 2-3 sentences and rephrase
  const keySentences = sentences.slice(0, 2).join('. ').trim();

  return `${keySentences}.`;
}

// Generate expanded content
function generateContent(title: string, abstract: string, journal: string): string {
  const summary = generateSummary(title, abstract);

  return `${summary}

According to research published in ${journal}, this development showcases the growing capabilities of artificial intelligence in transforming medical practice. The findings contribute to a broader understanding of how machine learning and AI systems can enhance healthcare delivery, improve patient outcomes, and accelerate medical research.

The study's implications extend across multiple areas of medicine, from improving diagnostic accuracy to optimizing treatment protocols. As AI technology continues to advance, such research plays a crucial role in shaping the future of healthcare.

This work adds to the growing body of evidence demonstrating AI's potential to address complex medical challenges and support healthcare professionals in delivering better patient care.`;
}

function getDefaultImage(category: string): string {
  const imageMap: Record<string, string> = {
    "diagnostics": "https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg",
    "surgery": "https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg",
    "drug-discovery": "https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg",
    "imaging": "https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg",
    "genomics": "https://images.pexels.com/photos/3825456/pexels-photo-3825456.jpeg",
    "research": "https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg"
  };

  return imageMap[category] || imageMap["research"];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting medical AI news crawl from PubMed...");

    const searchQueries = [
      "artificial intelligence medicine",
      "machine learning diagnosis",
      "deep learning medical imaging",
      "AI drug discovery",
      "neural network healthcare",
      "AI surgery robotics"
    ];

    const allArticles: NewsItem[] = [];

    for (const query of searchQueries) {
      console.log(`Searching PubMed for: ${query}`);
      const results = await searchPubMed(query, 5);

      for (const article of results) {
        const category = categorizeArticle(article.title, article.abstract);
        const summary = generateSummary(article.title, article.abstract);
        const content = generateContent(article.title, article.abstract, article.journal);

        const newsItem: NewsItem = {
          title: article.title,
          summary: summary,
          content: content,
          source: "MedNewsAI Editorial Team",
          source_url: article.url,
          original_source: article.journal,
          category: category,
          image_url: getDefaultImage(category),
          published_at: article.pubDate
        };

        allArticles.push(newsItem);
      }

      // Be respectful of API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Remove duplicates based on source_url
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.source_url, item])).values()
    );

    console.log(`Found ${uniqueArticles.length} unique articles`);

    // Insert articles into database
    let insertedCount = 0;
    for (const article of uniqueArticles) {
      const { error } = await supabase
        .from("medical_news")
        .upsert(article, { onConflict: "source_url", ignoreDuplicates: true });

      if (error && !error.message.includes("duplicate")) {
        console.error("Insert error:", error);
      } else if (!error) {
        insertedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully crawled and stored ${insertedCount} articles from PubMed`,
        total_found: uniqueArticles.length,
        inserted: insertedCount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
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