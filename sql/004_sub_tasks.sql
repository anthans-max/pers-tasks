-- Sub-tasks table: lightweight checklist items under a parent task
CREATE TABLE IF NOT EXISTS tm_sub_tasks (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id  text        NOT NULL REFERENCES tm_tasks(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL,
  title           text        NOT NULL,
  is_complete     boolean     DEFAULT false,
  sort_order      integer     DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_tasks_parent ON tm_sub_tasks(parent_task_id);

ALTER TABLE tm_sub_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tm_sub_tasks' AND policyname = 'allow_all_sub_tasks') THEN
    CREATE POLICY "allow_all_sub_tasks" ON tm_sub_tasks FOR ALL USING (true);
  END IF;
END $$;
