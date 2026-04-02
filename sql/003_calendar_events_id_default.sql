-- Fix: tm_calendar_events.id has no default, causing null constraint
-- violations when upserting new events via api/calendar/sync.js
ALTER TABLE tm_calendar_events
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
