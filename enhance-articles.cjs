// Skip dotenv in CI environments - use environment variables directly
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available
  }
}
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

async function enhanceWithAI(title, abstract, journal) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('⚠️  No API key found');
    return null;
  }

  try {
    if (process.env.OPENAI_API_KEY && !process.env.USE_GEMINI) {
      const prompt = `Create a compelling medical news article from this research.

Title: ${title}
Journal: ${journal}
Abstract: ${abstract}

Write a 2-3 sentence summary and 4-5 paragraph article (800-1200 words).
Return only JSON: {"summary": "...", "content": "..."}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        },
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 30000
        }
      );

      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } else if (process.env.GEMINI_API_KEY) {
      const prompt = `You are a medical AI news writer. Create a compelling, informative article from this research abstract.

Title: ${title}
Journal: ${journal}
Abstract: ${abstract}

Write:
1. A 2-3 sentence engaging summary that captures the key breakthrough or innovation
2. A comprehensive 4-5 paragraph article (800-1200 words) that:
   - Opens with the significance and real-world impact
   - Explains the methodology and AI/ML techniques
   - Details the key findings with specific examples
   - Discusses clinical implications
   - Concludes with future directions

Return ONLY JSON with keys "summary" and "content". No markdown, no code blocks.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 30000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
  } catch (error) {
    console.log(`    ⚠️  AI failed: ${error.message}`);
  }

  return null;
}

async function main() {
  console.log('🚀 Enhancing Articles with AI\n');

  await client.connect();
  console.log('✓ Connected to database\n');

  const { rows: articles } = await client.query(`
    SELECT id, title, summary, content, original_source
    FROM medical_news
    WHERE LENGTH(content) < 500
    ORDER BY published_at DESC
  `);

  console.log(`📊 Found ${articles.length} articles needing enhancement\n`);

  let enhanced = 0;

  for (const article of articles) {
    console.log(`📰 ${article.title.substring(0, 70)}...`);

    const result = await enhanceWithAI(
      article.title,
      article.content,
      article.original_source
    );

    if (result && result.summary && result.content && result.content.length > 500) {
      await client.query(
        `UPDATE medical_news SET summary = $1, content = $2 WHERE id = $3`,
        [result.summary, result.content, article.id]
      );
      console.log(`   ✓ Enhanced! ${result.content.length} chars\n`);
      enhanced++;
    } else {
      console.log(`   ⊘ Skipped\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`✅ Complete! Enhanced: ${enhanced}/${articles.length}`);
  await client.end();
}

main().catch(console.error);
