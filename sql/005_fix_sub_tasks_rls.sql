-- Fix: replace FOR ALL policy with explicit SELECT + write policies
-- for Supabase anon key compatibility
DROP POLICY IF EXISTS "allow_all_sub_tasks" ON tm_sub_tasks;

CREATE POLICY "allow_read_sub_tasks" ON tm_sub_tasks FOR SELECT USING (true);

CREATE POLICY "allow_write_sub_tasks" ON tm_sub_tasks FOR ALL USING (true) WITH CHECK (true);
