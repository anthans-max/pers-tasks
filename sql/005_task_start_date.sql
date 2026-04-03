-- Add start_date column to support date ranges on tasks.
-- When start_date is set, the task spans start_date through due_date.
-- When start_date is null, behavior is unchanged (single due date).
ALTER TABLE tm_tasks ADD COLUMN start_date date;
