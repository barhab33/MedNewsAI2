/*
  # Add Multi-LLM Summarization Support

  1. Changes to existing tables
    - Add `processing_status` to medical_news table to track article processing state
    - Add `raw_content` to store original unprocessed article content

  2. New Tables
    - `ai_summaries`
      - `id` (uuid, primary key) - Unique identifier for each summary
      - `article_id` (uuid, foreign key) - References medical_news table
      - `model_provider` (text, not null) - AI provider (openai, gemini, groq, anthropic)
      - `model_name` (text, not null) - Specific model used (gpt-4, gemini-pro, etc.)
      - `summary_text` (text, not null) - Generated summary text
      - `content_text` (text) - Generated expanded content
      - `generation_time_ms` (integer) - Time taken to generate (milliseconds)
      - `tokens_used` (integer) - Tokens consumed (if available)
      - `error_message` (text) - Error details if generation failed
      - `created_at` (timestamptz, default now()) - Generation timestamp

    - `processing_queue`
      - `id` (uuid, primary key) - Unique identifier for queue item
      - `article_id` (uuid, foreign key) - References medical_news table
      - `status` (text, not null) - pending, processing, completed, failed
      - `priority` (integer, default 50) - Processing priority (0-100)
      - `retry_count` (integer, default 0) - Number of retry attempts
      - `last_error` (text) - Last error message if failed
      - `created_at` (timestamptz, default now()) - Queue entry timestamp
      - `started_at` (timestamptz) - Processing start time
      - `completed_at` (timestamptz) - Processing completion time

    - `api_usage_stats`
      - `id` (uuid, primary key) - Unique identifier
      - `provider` (text, not null) - AI provider name
      - `endpoint` (text, not null) - API endpoint called
      - `tokens_used` (integer) - Tokens consumed
      - `cost_usd` (decimal) - Estimated cost in USD
      - `response_time_ms` (integer) - Response time in milliseconds
      - `status_code` (integer) - HTTP status code
      - `error_message` (text) - Error details if request failed
      - `created_at` (timestamptz, default now()) - Request timestamp

  3. Security
    - Enable RLS on all new tables
    - Public read access for ai_summaries (to display on frontend)
    - Service role only for processing_queue and api_usage_stats
    - Restrict insert/update/delete to service role only

  4. Indexes
    - Index on ai_summaries(article_id) for fast lookups
    - Index on ai_summaries(model_provider) for filtering by provider
    - Index on processing_queue(status) for queue management
    - Index on api_usage_stats(provider, created_at) for analytics

  5. Important Notes
    - Multiple AI models can generate summaries for the same article
    - Processing queue enables background job processing
    - API usage tracking helps monitor costs and performance
    - System supports graceful degradation if one provider fails
*/

-- Add new columns to medical_news table
ALTER TABLE medical_news
  ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS raw_content text,
  ADD COLUMN IF NOT EXISTS fetch_error text;

-- Create ai_summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES medical_news(id) ON DELETE CASCADE,
  model_provider text NOT NULL,
  model_name text NOT NULL,
  summary_text text NOT NULL,
  content_text text,
  generation_time_ms integer,
  tokens_used integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create processing_queue table
CREATE TABLE IF NOT EXISTS processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES medical_news(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority integer DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  retry_count integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Create api_usage_stats table
CREATE TABLE IF NOT EXISTS api_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  endpoint text NOT NULL,
  tokens_used integer,
  cost_usd decimal(10, 4),
  response_time_ms integer,
  status_code integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_summaries_article_id ON ai_summaries(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_provider ON ai_summaries(model_provider);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_created_at ON ai_summaries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_priority ON processing_queue(priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_processing_queue_article ON processing_queue(article_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_provider_date ON api_usage_stats(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_stats(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_news_processing_status ON medical_news(processing_status);

-- Enable Row Level Security
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policies for ai_summaries (public can read, service role can write)
CREATE POLICY "Anyone can view AI summaries"
  ON ai_summaries
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert AI summaries"
  ON ai_summaries
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update AI summaries"
  ON ai_summaries
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for processing_queue (service role only)
CREATE POLICY "Service role can manage processing queue"
  ON processing_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for api_usage_stats (service role only)
CREATE POLICY "Service role can manage API usage stats"
  ON api_usage_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to get next article for processing
CREATE OR REPLACE FUNCTION get_next_article_for_processing()
RETURNS TABLE (
  article_id uuid,
  title text,
  raw_content text,
  category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mn.id as article_id,
    mn.title,
    mn.raw_content,
    mn.category
  FROM medical_news mn
  LEFT JOIN processing_queue pq ON mn.id = pq.article_id AND pq.status = 'pending'
  WHERE mn.processing_status = 'pending'
  ORDER BY
    COALESCE(pq.priority, 50) DESC,
    mn.published_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
