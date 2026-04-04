// One-time seed script — run with the service role key (bypasses RLS)
// Usage:
//   SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... SEED_USER_ID=<uuid> node scripts/seed.js

import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SEED_USER_ID } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SEED_USER_ID) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, SEED_USER_ID");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Source data (copied from App.jsx) ───────────────────────────────────────

const DEFAULT_PROJECTS = [
  { id: "lotus",     name: "Lotus AI Lab",          color: "#4A7C6F" },
  { id: "sundermed", name: "Sunder Med/Personal",   color: "#B5871A" },
  { id: "personal",  name: "Personal",               color: "#7B6FAA" },
  { id: "aarasaan",  name: "AaraSaan Consulting",    color: "#8A8278" },
];

const DEFAULT_TASKS = [
  { id: "t1",  projectId: "personal",  title: "Karla bills",                                        priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t2",  projectId: "sundermed", title: "Reset ADP payroll",                                  priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t3",  projectId: "personal",  title: "Personal taxes",                                     priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t4",  projectId: "lotus",     title: "Business development",                               priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t5",  projectId: "lotus",     title: "Print certificate for wish raffle",                  priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t6",  projectId: "lotus",     title: "Networking opportunities",                           priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t7",  projectId: "lotus",     title: "Headhunter",                                         priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t8",  projectId: "lotus",     title: "Lead generation app",                                priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t9",  projectId: "lotus",     title: "Mark Howarth",                                       priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t10", projectId: "lotus",     title: "Disc profile assessment",                            priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t11", projectId: "lotus",     title: "Open claw",                                          priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t12", projectId: "lotus",     title: "Wayne Garb",                                         priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t13", projectId: "lotus",     title: "Lotus Links backlog",                                priority: 4, dueDate: "",           completed: false, fromEmail: false, subtasks: 1, subtasksDone: 0 },
  { id: "t14", projectId: "lotus",     title: "Cursor",                                             priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t15", projectId: "sundermed", title: "Cancel LinkedIn Premium",                            priority: 1, dueDate: "2026-04-23", completed: false, fromEmail: false },
  { id: "t16", projectId: "sundermed", title: "Call DEA",                                           priority: 1, dueDate: "",           completed: false, fromEmail: false, subtasks: 1, subtasksDone: 0 },
  { id: "t17", projectId: "sundermed", title: "Transfer funds from pension to IRA",                 priority: 1, dueDate: "2025-08-31", completed: false, fromEmail: false },
  { id: "t18", projectId: "sundermed", title: "LCMG statement of info",                             priority: 2, dueDate: "2026-03-31", completed: false, fromEmail: false, recurring: true, recurrence: "monthly" },
  { id: "t19", projectId: "sundermed", title: "Sunder Med statement of info",                       priority: 2, dueDate: "2026-10-31", completed: false, fromEmail: false, recurring: true, recurrence: "monthly" },
  { id: "t20", projectId: "sundermed", title: "Peacock statement of information",                   priority: 2, dueDate: "2027-05-31", completed: false, fromEmail: false },
  { id: "t21", projectId: "sundermed", title: "Website for peacock",                                priority: 1, dueDate: "",           completed: false, fromEmail: false },
  { id: "t22", projectId: "sundermed", title: "Sunder Medical Month-end",                           priority: 4, dueDate: "2026-04-01", completed: false, fromEmail: false, recurring: true, recurrence: "monthly", subtasks: 5, subtasksDone: 5 },
  { id: "t23", projectId: "sundermed", title: "Southwest refund for mom",                           priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t24", projectId: "personal",  title: "Call SRF re app",                                    priority: 2, dueDate: "",           completed: false, fromEmail: false },
  { id: "t25", projectId: "personal",  title: "SimpliSafe - reduce plan",                           priority: 4, dueDate: "2026-09-06", completed: false, fromEmail: false },
  { id: "t26", projectId: "personal",  title: "Refinance auto loan",                                priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t27", projectId: "personal",  title: "Create social security account on ssa.gov",          priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t28", projectId: "personal",  title: "Lincoln Roadside Assistance",                        priority: 4, dueDate: "",           completed: false, fromEmail: false },
  { id: "t29", projectId: "aarasaan",  title: "Amazon jobs site",                                   priority: 1, dueDate: "",           completed: false, fromEmail: false },
  { id: "t30", projectId: "aarasaan",  title: "Statement of incorporation for AaraSaan",            priority: 2, dueDate: "2026-11-30", completed: false, fromEmail: false, recurring: true, recurrence: "monthly" },
];

// ─── camelCase → snake_case mappers ──────────────────────────────────────────

function mapProject(p) {
  return {
    id:         p.id,
    user_id:    SEED_USER_ID,
    name:       p.name,
    color:      p.color,
  };
}

function mapTask(t) {
  return {
    id:            t.id,
    user_id:       SEED_USER_ID,
    project_id:    t.projectId,
    title:         t.title,
    notes:         "",
    priority:      t.priority,
    due_date:      t.dueDate || null,
    completed:     t.completed,
    recurring:            t.recurring ?? false,
    recurrence:           t.recurrence ?? null,
    recurring_parent_id:  t.recurringParentId ?? null,
    subtasks:             t.subtasks ?? 0,
    subtasks_done:        t.subtasksDone ?? 0,
    from_email:           t.fromEmail,
    email_from:           t.emailFrom ?? null,
  };
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding as user: ${SEED_USER_ID}\n`);

  // 1. Projects
  const { error: projErr } = await supabase
    .from("tm_projects")
    .upsert(DEFAULT_PROJECTS.map(mapProject), { onConflict: "id" });

  if (projErr) {
    console.error("tm_projects: FAILED —", projErr.message);
  } else {
    console.log(`tm_projects: OK — ${DEFAULT_PROJECTS.length} rows upserted`);
  }

  // 2. Tasks
  const { error: taskErr } = await supabase
    .from("tm_tasks")
    .upsert(DEFAULT_TASKS.map(mapTask), { onConflict: "id" });

  if (taskErr) {
    console.error("tm_tasks: FAILED —", taskErr.message);
  } else {
    console.log(`tm_tasks: OK — ${DEFAULT_TASKS.length} rows upserted`);
  }
}

seed();
