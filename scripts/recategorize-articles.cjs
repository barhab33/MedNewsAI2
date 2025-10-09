#!/usr/bin/env node
/**
 * Recategorize existing articles using improved categorization logic
 */

require("dotenv").config();
const { sb } = require("./lib/supabase-server.cjs");

function inferCategoryFromKeywords(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (/\b(drug|pharma|molecule|compound|therapeut|medication)\b/.test(text)) return "Drug Discovery";
  if (/\b(surgery|surgical|operation|robotic surg)\b/.test(text)) return "Surgery";
  if (/\b(trial|clinic[^\s]*\s+trial|patient enrollment|randomized)\b/.test(text)) return "Clinical Trials";
  if (/\b(diagnos|detect|screen|biomarker|early detection)\b/.test(text)) return "Diagnostics";
  if (/\b(imaging|radiology|mri|ct scan|x-ray|ultrasound|scan)\b/.test(text)) return "Medical Imaging";
  if (/\b(patient care|hospital|nursing|bedside|icu|emergency|ed triage)\b/.test(text)) return "Patient Care";
  if (/\b(genom|dna|gene|genetic|crispr|sequenc)\b/.test(text)) return "Genomics";
  if (/\b(telemedicine|telehealth|remote|virtual visit|video consult)\b/.test(text)) return "Telemedicine";

  return "Research";
}

async function recategorizeArticles() {
  console.log("Fetching articles from database...");

  const { data: articles, error } = await sb
    .from("medical_news")
    .select("id, title, summary, category")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    process.exit(1);
  }

  console.log(`Found ${articles.length} articles to recategorize`);

  let updated = 0;
  let unchanged = 0;

  for (const article of articles) {
    const newCategory = inferCategoryFromKeywords(article.title, article.summary || "");

    if (newCategory !== article.category) {
      console.log(`\nUpdating: ${article.title.substring(0, 60)}...`);
      console.log(`  Old: ${article.category} → New: ${newCategory}`);

      const { error: updateError } = await sb
        .from("medical_news")
        .update({ category: newCategory })
        .eq("id", article.id);

      if (updateError) {
        console.error(`  Error updating article ${article.id}:`, updateError);
      } else {
        updated++;
      }
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ Recategorization complete!`);
  console.log(`   Updated: ${updated} articles`);
  console.log(`   Unchanged: ${unchanged} articles`);
}

recategorizeArticles().catch(console.error);
