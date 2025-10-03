/*
  # Create Medical News Table for Real-Time News Aggregation

  1. New Tables
    - `medical_news`
      - `id` (uuid, primary key) - Unique identifier for each news article
      - `title` (text, not null) - Article headline
      - `description` (text) - Article summary/excerpt
      - `content` (text) - Full article content
      - `category` (text, not null) - Medical AI category (Diagnostics, Surgery, Drug Discovery, etc.)
      - `source` (text, not null) - Publication/source name
      - `source_url` (text, unique, not null) - Original article URL (used for deduplication)
      - `image_url` (text) - Article image/thumbnail URL
      - `impact_score` (integer, default 70) - Calculated impact score (0-100)
      - `published_at` (timestamptz, not null) - Original publication date
      - `created_at` (timestamptz, default now()) - Database insertion timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on `medical_news` table
    - Add policy for public read access (news is publicly viewable)
    - Add policy for service role to insert/update (crawler function)

  3. Indexes
    - Index on `category` for fast filtering
    - Index on `impact_score` for sorting by importance
    - Index on `published_at` for chronological sorting
    - Unique index on `source_url` for deduplication

  4. Important Notes
    - All news articles are crawled from real sources
    - `source_url` ensures no duplicates are stored
    - Impact scoring helps surface the most important breakthroughs
    - Public read access allows anyone to view news without authentication
*/

-- Create medical_news table
CREATE TABLE IF NOT EXISTS medical_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  category text NOT NULL,
  source text NOT NULL,
  source_url text UNIQUE NOT NULL,
  image_url text,
  impact_score integer DEFAULT 70 CHECK (impact_score >= 0 AND impact_score <= 100),
  published_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_news_category ON medical_news(category);
CREATE INDEX IF NOT EXISTS idx_medical_news_impact_score ON medical_news(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_medical_news_published_at ON medical_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_news_created_at ON medical_news(created_at DESC);

-- Enable Row Level Security
ALTER TABLE medical_news ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read medical news (public access)
CREATE POLICY "Anyone can view medical news"
  ON medical_news
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert news articles
CREATE POLICY "Service role can insert news"
  ON medical_news
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only service role can update news articles
CREATE POLICY "Service role can update news"
  ON medical_news
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_medical_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_medical_news_updated_at_trigger ON medical_news;
CREATE TRIGGER update_medical_news_updated_at_trigger
  BEFORE UPDATE ON medical_news
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_news_updated_at();