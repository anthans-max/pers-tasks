-- Table to store daily newsletter story summaries
-- Run this in the Supabase SQL editor before using scripts/capture-news.js

-- 1. Create news summaries table
CREATE TABLE IF NOT EXISTS tm_news_summaries (
  id          text        PRIMARY KEY,
  source      text        NOT NULL,
  headline    text        NOT NULL,
  category    text        NOT NULL,
  summary     text        NOT NULL,
  story_date  date        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 2. Unique constraint to prevent duplicate stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tm_news_summaries_source_headline_date_unique'
  ) THEN
    ALTER TABLE tm_news_summaries
      ADD CONSTRAINT tm_news_summaries_source_headline_date_unique
      UNIQUE (source, headline, story_date);
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE tm_news_summaries ENABLE ROW LEVEL SECURITY;
