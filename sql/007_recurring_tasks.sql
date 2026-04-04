-- 007: Add recurrence pattern and lineage tracking to tm_tasks
-- Run in Supabase SQL Editor

ALTER TABLE tm_tasks
  ADD COLUMN IF NOT EXISTS recurrence text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurring_parent_id text DEFAULT NULL;

ALTER TABLE tm_tasks
  ADD CONSTRAINT chk_recurrence_pattern
  CHECK (recurrence IS NULL OR recurrence IN ('daily','weekly','biweekly','monthly'));

CREATE INDEX IF NOT EXISTS idx_tasks_recurring_parent
  ON tm_tasks(recurring_parent_id) WHERE recurring_parent_id IS NOT NULL;

-- Backfill existing recurring=true tasks (monthly filings)
UPDATE tm_tasks SET recurrence = 'monthly'
  WHERE recurring = true AND recurrence IS NULL;
