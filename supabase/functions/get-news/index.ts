import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client } from "npm:pg@8.16.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const client = new Client({
      host: 'db.qhyrfjletazbsjsfosdl.supabase.co',
      port: 5432,
      user: 'postgres',
      password: '8ZKt+2D2_2s4fyE',
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(`
      SELECT id, title, summary, content, category, original_source, source_url, image_url, published_at, processing_status
      FROM medical_news
      WHERE processing_status = 'completed'
      ORDER BY published_at DESC
      LIMIT 100
    `);

    await client.end();

    return new Response(
      JSON.stringify(result.rows),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});