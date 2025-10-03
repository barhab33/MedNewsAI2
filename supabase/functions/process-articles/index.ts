import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LLMProvider {
  name: string;
  provider: string;
  model: string;
  envKey: string;
  enabled: boolean;
  generate: (apiKey: string, title: string, category: string) => Promise<{summary: string, content: string}>;
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    name: 'Google Gemini',
    provider: 'gemini',
    model: 'gemini-pro',
    envKey: 'GEMINI_API_KEY',
    enabled: false,
    generate: async (apiKey: string, title: string, category: string) => {
      const summaryPrompt = `Write a compelling 2-3 sentence summary for this medical AI news article.

Title: "${title}"
Category: ${category}

Write ONLY the summary (no preamble):`;

      const contentPrompt = `Expand this medical AI news story into 3 detailed, informative paragraphs.

Title: "${title}"
Category: ${category}

Write 3 paragraphs:`;

      const summaryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: summaryPrompt }] }]
          })
        }
      );

      const summaryData = await summaryResponse.json();
      const summary = summaryData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      const contentResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contentPrompt }] }]
          })
        }
      );

      const contentData = await contentResponse.json();
      const content = contentData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      return { summary: summary || '', content: content || '' };
    }
  },
  {
    name: 'Groq Llama',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    enabled: false,
    generate: async (apiKey: string, title: string, category: string) => {
      const summaryPrompt = `Write a compelling 2-3 sentence summary for this medical AI news article.

Title: "${title}"
Category: ${category}

Write ONLY the summary:`;

      const contentPrompt = `Expand this medical AI news story into 3 detailed paragraphs.

Title: "${title}"
Category: ${category}

Write 3 paragraphs:`;

      const summaryResponse = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: summaryPrompt }],
            temperature: 0.7,
            max_tokens: 200
          })
        }
      );

      const summaryData = await summaryResponse.json();
      const summary = summaryData?.choices?.[0]?.message?.content?.trim();

      const contentResponse = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: contentPrompt }],
            temperature: 0.7,
            max_tokens: 600
          })
        }
      );

      const contentData = await contentResponse.json();
      const content = contentData?.choices?.[0]?.message?.content?.trim();

      return { summary: summary || '', content: content || '' };
    }
  },
  {
    name: 'xAI Grok',
    provider: 'xai',
    model: 'grok-beta',
    envKey: 'XAI_API_KEY',
    enabled: false,
    generate: async (apiKey: string, title: string, category: string) => {
      const summaryPrompt = `Write a compelling 2-3 sentence summary for this medical AI news article.

Title: "${title}"
Category: ${category}

Write ONLY the summary:`;

      const contentPrompt = `Expand this medical AI news story into 3 detailed paragraphs.

Title: "${title}"
Category: ${category}

Write 3 paragraphs:`;

      const summaryResponse = await fetch(
        'https://api.x.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [{ role: 'user', content: summaryPrompt }],
            temperature: 0.7,
            max_tokens: 200
          })
        }
      );

      const summaryData = await summaryResponse.json();
      const summary = summaryData?.choices?.[0]?.message?.content?.trim();

      const contentResponse = await fetch(
        'https://api.x.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [{ role: 'user', content: contentPrompt }],
            temperature: 0.7,
            max_tokens: 600
          })
        }
      );

      const contentData = await contentResponse.json();
      const content = contentData?.choices?.[0]?.message?.content?.trim();

      return { summary: summary || '', content: content || '' };
    }
  }
];

function initializeProviders() {
  for (const provider of LLM_PROVIDERS) {
    const apiKey = Deno.env.get(provider.envKey);
    if (apiKey && apiKey.length > 10) {
      provider.enabled = true;
      console.log(`✓ ${provider.name} enabled`);
    }
  }

  const enabledCount = LLM_PROVIDERS.filter(p => p.enabled).length;
  console.log(`${enabledCount} provider(s) ready`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    initializeProviders();

    const enabledProviders = LLM_PROVIDERS.filter(p => p.enabled);
    if (enabledProviders.length === 0) {
      throw new Error('No AI providers configured');
    }

    const { data: pendingArticles } = await supabase
      .from('medical_news')
      .select('id, title, category, raw_content')
      .eq('processing_status', 'pending')
      .order('published_at', { ascending: false })
      .limit(20);

    if (!pendingArticles || pendingArticles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending articles to process',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    console.log(`Processing ${pendingArticles.length} articles...`);

    let processedCount = 0;
    let summariesGenerated = 0;

    for (const article of pendingArticles) {
      console.log(`\nProcessing: ${article.title}`);

      await supabase
        .from('medical_news')
        .update({ processing_status: 'processing' })
        .eq('id', article.id);

      let hasSuccessfulSummary = false;
      let bestSummary = '';
      let bestContent = '';

      for (const provider of enabledProviders) {
        try {
          console.log(`Trying ${provider.name}...`);

          const startTime = Date.now();
          const apiKey = Deno.env.get(provider.envKey)!;

          const { summary, content } = await provider.generate(
            apiKey,
            article.title,
            article.category
          );

          const generationTime = Date.now() - startTime;

          if (summary && content) {
            const { error: summaryError } = await supabase
              .from('ai_summaries')
              .insert({
                article_id: article.id,
                model_provider: provider.provider,
                model_name: provider.model,
                summary_text: summary,
                content_text: content,
                generation_time_ms: generationTime
              });

            if (!summaryError) {
              console.log(`✓ ${provider.name} succeeded`);
              summariesGenerated++;
              hasSuccessfulSummary = true;

              if (!bestSummary || summary.length > bestSummary.length) {
                bestSummary = summary;
                bestContent = content;
              }

              await supabase
                .from('api_usage_stats')
                .insert({
                  provider: provider.provider,
                  endpoint: 'generate',
                  response_time_ms: generationTime,
                  status_code: 200
                });
            }
          }
        } catch (error) {
          console.error(`✗ ${provider.name} failed:`, error.message);

          await supabase
            .from('ai_summaries')
            .insert({
              article_id: article.id,
              model_provider: provider.provider,
              model_name: provider.model,
              summary_text: '',
              error_message: error.message
            });

          await supabase
            .from('api_usage_stats')
            .insert({
              provider: provider.provider,
              endpoint: 'generate',
              status_code: 500,
              error_message: error.message
            });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (hasSuccessfulSummary && bestSummary) {
        await supabase
          .from('medical_news')
          .update({
            summary: bestSummary,
            content: bestContent,
            processing_status: 'completed'
          })
          .eq('id', article.id);

        processedCount++;
      } else {
        await supabase
          .from('medical_news')
          .update({
            processing_status: 'failed',
            fetch_error: 'All AI providers failed to generate summary'
          })
          .eq('id', article.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} articles with ${summariesGenerated} summaries`,
        processed: processedCount,
        summaries_generated: summariesGenerated
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Processing error:", error);
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
