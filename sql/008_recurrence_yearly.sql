-- 008: Allow 'yearly' as a recurrence pattern on tm_tasks
-- Run in Supabase SQL Editor

ALTER TABLE tm_tasks
  DROP CONSTRAINT IF EXISTS chk_recurrence_pattern;

ALTER TABLE tm_tasks
  ADD CONSTRAINT chk_recurrence_pattern
  CHECK (recurrence IS NULL OR recurrence IN ('daily','weekly','biweekly','monthly','yearly'));
