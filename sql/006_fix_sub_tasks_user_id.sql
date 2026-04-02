-- Fix: user_id was uuid but USER_ID is a plain string (e.g. "anthan")
ALTER TABLE tm_sub_tasks ALTER COLUMN user_id TYPE text;
