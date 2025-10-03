const { Client } = require('pg');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAYVNaJ30x7fRATb5aLX5z-pmOFNnFeBk0';

const client = new Client({
  host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8ZKt+2D2_2s4fyE',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const articles = [
  { title: 'AI System Detects Early Signs of Alzheimer\'s Disease with 95% Accuracy', category: 'Diagnostics', source: 'Stanford Medicine' },
  { title: 'New Machine Learning Algorithm Predicts Cancer Treatment Outcomes', category: 'Oncology', source: 'MIT Research' },
  { title: 'Robotic Surgery Reduces Recovery Time by 50% in Heart Procedures', category: 'Surgery', source: 'Johns Hopkins' },
  { title: 'AI-Powered Drug Discovery Identifies Potential Breakthrough for Diabetes', category: 'Drug Discovery', source: 'Nature Medicine' },
  { title: 'Deep Learning Model Improves MRI Image Analysis for Brain Tumors', category: 'Medical Imaging', source: 'Mayo Clinic' },
  { title: 'Artificial Intelligence Assists in Real-Time Surgical Decision Making', category: 'Surgery', source: 'Cleveland Clinic' },
  { title: 'Machine Learning Predicts Patient Outcomes in ICU with High Accuracy', category: 'Patient Care', source: 'UCSF Health' },
  { title: 'AI Chatbot Provides Mental Health Support to 10,000 Patients Daily', category: 'Mental Health', source: 'Harvard Medical School' },
  { title: 'Computer Vision System Detects Diabetic Retinopathy in Rural Clinics', category: 'Diagnostics', source: 'Google Health' },
  { title: 'Neural Network Analyzes Genetic Data to Predict Disease Risk', category: 'Research', source: 'Broad Institute' }
];

async function generateWithAI(title, category, source) {
  try {
    const summaryResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: `Write a compelling 2-3 sentence summary for this medical news article. Be specific and informative:

Title: "${title}"
Category: ${category}
Source: ${source}

Write ONLY the summary, no preamble.` }]
        }]
      },
      { timeout: 15000 }
    );

    const summary = summaryResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    const contentResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: `Expand this into a detailed 3-paragraph medical news article. Be authoritative and specific:

Title: "${title}"
Category: ${category}
Source: ${source}

Write 3 well-developed paragraphs. No preamble.` }]
        }]
      },
      { timeout: 15000 }
    );

    const content = contentResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return { summary, content };
  } catch (error) {
    console.error('AI generation failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Quick Generate: Creating 10 AI-powered medical news articles\n');

  await client.connect();
  console.log('✓ Connected to database\n');

  // Clear old articles
  await client.query('DELETE FROM medical_news');
  console.log('✓ Cleared old articles\n');

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`📰 [${i + 1}/10] ${article.title.substring(0, 60)}...`);

    const generated = await generateWithAI(article.title, article.category, article.source);

    if (generated) {
      await client.query(
        `INSERT INTO medical_news (title, summary, content, source, source_url, original_source, category, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          article.title,
          generated.summary,
          generated.content,
          article.source,
          `https://example.com/article-${i + 1}`,
          article.source,
          article.category
        ]
      );
      console.log(`   ✓ Generated with AI (${generated.content.length} chars)\n`);
    } else {
      console.log('   ❌ Failed, skipping\n');
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await client.end();
  console.log('✅ Done! Generated 10 articles with AI.\n');
  console.log('Next step: Run "node export-to-public.cjs" to update your site!');
}

main().catch(console.error);
