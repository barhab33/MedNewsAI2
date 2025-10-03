import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function callEdgeFunction(functionName: string): Promise<any> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting scheduled update...');
    const startTime = Date.now();

    console.log('Step 1: Fetching news from RSS feeds...');
    const fetchResult = await callEdgeFunction('fetch-news');
    console.log(`✓ Fetch completed: ${JSON.stringify(fetchResult)}`);

    if (!fetchResult.success) {
      throw new Error(`Fetch failed: ${fetchResult.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Step 2: Processing articles with AI...');
    const processResult = await callEdgeFunction('process-articles');
    console.log(`✓ Process completed: ${JSON.stringify(processResult)}`);

    if (!processResult.success) {
      throw new Error(`Process failed: ${processResult.error}`);
    }

    const totalTime = Date.now() - startTime;

    const { count: totalArticles } = await supabase
      .from('medical_news')
      .select('*', { count: 'exact', head: true });

    const { count: completedArticles } = await supabase
      .from('medical_news')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'completed');

    const summary = {
      success: true,
      message: 'Scheduled update completed successfully',
      execution_time_ms: totalTime,
      fetch_result: {
        new_articles: fetchResult.inserted || 0,
        queued: fetchResult.queued_for_processing || 0
      },
      process_result: {
        processed: processResult.processed || 0,
        summaries_generated: processResult.summaries_generated || 0
      },
      database_stats: {
        total_articles: totalArticles || 0,
        completed_articles: completedArticles || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('Update summary:', JSON.stringify(summary, null, 2));

    await supabase
      .from('api_usage_stats')
      .insert({
        provider: 'scheduler',
        endpoint: 'scheduled-update',
        response_time_ms: totalTime,
        status_code: 200
      });

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Scheduled update error:", error);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('api_usage_stats')
      .insert({
        provider: 'scheduler',
        endpoint: 'scheduled-update',
        status_code: 500,
        error_message: error.message
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
