-- Table to persist Google Calendar sync tokens for incremental sync
-- Run this in the Supabase SQL editor before using scripts/sync-gcal.js

-- 1. Create sync tokens table (keyed by calendar_id only)
CREATE TABLE IF NOT EXISTS tm_sync_tokens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id text NOT NULL UNIQUE,
  sync_token  text NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE tm_sync_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Add unique constraint on tm_calendar_events for upsert-by-gcal-event
-- (skip if the constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tm_calendar_events_gcal_source_unique'
  ) THEN
    ALTER TABLE tm_calendar_events
      ADD CONSTRAINT tm_calendar_events_gcal_source_unique
      UNIQUE (gcal_event_id, calendar_source);
  END IF;
END $$;

-- 4. Add columns to tm_calendar_events if missing
ALTER TABLE tm_calendar_events ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE tm_calendar_events ADD COLUMN IF NOT EXISTS status       text    DEFAULT 'confirmed';
ALTER TABLE tm_calendar_events ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();
