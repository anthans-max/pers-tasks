# Plan: Add Date Ranges to Tasks

## Context
Tasks currently have a single `due_date` column. The goal is to support optional start/end date ranges for multi-day events or tasks that span a window of time. The single-date flow remains the default; date ranges are opt-in.

## Current State

### Schema
- `tm_tasks.due_date` — nullable date column, mapped to `task.dueDate` in JS
- No `start_date` column exists

### Task creation (Add modal)
- State: `newDate` (line 153) — single date string
- Form: `<input type="date">` in 3-column grid at line 1039
- Insert: `due_date: newTask.dueDate || null` at line 355

### Task edit (Detail panel)
- Desktop: line 1233 — `<input type="date">` bound to `task.dueDate`
- Mobile: line 1072 — same pattern in mobile bottom sheet
- Update: `updateTask()` at line 379 — `patch.due_date = u.dueDate || null`

### Task display (Card)
- Line 681-682: shows `fmtDate(task.dueDate)` with overdue/today coloring
- `fmtDate()` (line 52-60): smart formatting (Today, Tomorrow, day name, "Mon D")
- `isOverdue()` (line 61): checks if date < today
- `isToday()` (line 62): checks if date === today

### Filtering
- `visTasks` (line 310-316): filters by `x.dueDate === dayFilter`
- Calendar view (line 336-341): groups tasks by `dueDate` into day buckets

### Data load
- Line 191: `dueDate: r.due_date ?? ""`

---

## Implementation Plan

### 1. Migration SQL (`sql/005_task_start_date.sql`)

Add `start_date` alongside existing `due_date` (which serves as the end date). No renaming — backward compatible.

```sql
ALTER TABLE tm_tasks ADD COLUMN start_date date;
```

When `start_date` is set, the task spans `start_date` through `due_date`. When `start_date` is null, behavior is unchanged (single due date).

### 2. Data layer changes (`src/App.jsx`)

**Load** (line 191): add `startDate: r.start_date ?? ""`

**Create** — `addTask()` (line 353-357): add `start_date: newTask.startDate || null`

**Update** — `updateTask()` (line 373-387): add `if(u.startDate !== undefined) patch.start_date = u.startDate || null;`

**State** — add `newStartDate` state var (near line 153): `const [newStartDate, setNewStartDate] = useState("");`

**Reset** — in `addTask()` line 352: add `setNewStartDate("");`

### 3. New helper: `fmtDateRange(startDate, endDate)`

Add near line 60, after `fmtDate`:

```javascript
const fmtDateRange = (s, e) => {
  if (!s || !e) return fmtDate(e || s);
  const sd = new Date(s + "T00:00:00"), ed = new Date(e + "T00:00:00");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear())
    return `${mo[sd.getMonth()]} ${sd.getDate()} – ${ed.getDate()}`;
  return `${mo[sd.getMonth()]} ${sd.getDate()} – ${mo[ed.getMonth()]} ${ed.getDate()}`;
};
```

Produces compact output: "Apr 9 – 13" (same month) or "Mar 28 – Apr 2" (cross-month).

### 4. UI: Add modal (task creation)

**Location:** line 1036-1046 (the 3-column grid)

- Add a "Date range" toggle (small checkbox or link) below the Due Date field
- When toggled on: show a "Start Date" field and relabel "Due Date" to "End Date"
- When toggled off (default): single "Due Date" field, same as today
- Grid changes from `1fr 1fr 1fr` to `1fr 1fr` when date range is active (Start Date + End Date on one row, Priority + Project on next row)
- New state: `const [newDateRange, setNewDateRange] = useState(false);`

### 5. UI: Detail panel (task edit)

**Desktop** (line 1232-1238) and **Mobile** (line 1070-1077):

- If `task.startDate` is set, show two date fields (Start Date / End Date) instead of one
- Add a small "Add date range" link below the due date field when no start date is set
- Add an "×" to remove the start date (revert to single due date)
- Validation: if start_date > due_date, swap them

### 6. UI: Task card display

**Location:** line 681-682

Replace the date display logic:

```javascript
{(task.startDate || task.dueDate) && <span style={{...}}>
  📅 {task.startDate ? fmtDateRange(task.startDate, task.dueDate) : fmtDate(task.dueDate)}
  {task.recurring && <Ico .../>}
</span>}
```

### 7. Overdue styling for date ranges

Update `isOverdue()` usage: a date-range task is overdue when `due_date` (end date) is past — no change needed since overdue already checks `due_date`.

For "in progress" styling (today falls within the range): add helper:

```javascript
const isActive = (s, e) => {
  if (!s || !e) return false;
  const now = new Date(); now.setHours(0,0,0,0);
  return new Date(s+"T00:00:00") <= now && now <= new Date(e+"T00:00:00");
};
```

Active tasks get forest green date text (same as today styling).

### 8. Date filtering / Calendar view

**`visTasks` filter** (line 312-313): A date-range task should appear when `dayFilter` falls within its range:

```javascript
// Replace exact match: x.dueDate === dayFilter
// With range-aware match:
const matchesDay = (x, day) => {
  if (x.startDate && x.dueDate) return x.startDate <= day && day <= x.dueDate;
  return x.dueDate === day;
};
```

**Calendar grid** (line 336-341): Date-range tasks should appear on every day they span, not just their `dueDate`. Update the `all.forEach` loop to expand range tasks across multiple days within the visible month.

### 9. Email task creation

**`assignEmail`** (line 439-444) and **`batchAssign`** (line 462-467): add `start_date: null` to inserts. Email tasks don't have date ranges by default.

---

## Files to modify

| File | Change |
|------|--------|
| `sql/005_task_start_date.sql` | New migration — `ALTER TABLE` |
| `src/App.jsx` ~line 60 | Add `fmtDateRange()` and `isActive()` helpers |
| `src/App.jsx` ~line 153 | Add `newStartDate`, `newDateRange` state |
| `src/App.jsx` ~line 191 | Map `start_date` from DB |
| `src/App.jsx` ~line 350 | Include `startDate` in new task object |
| `src/App.jsx` ~line 355 | Include `start_date` in Supabase insert |
| `src/App.jsx` ~line 379 | Include `start_date` in update patch |
| `src/App.jsx` ~line 312 | Update `visTasks` filter for ranges |
| `src/App.jsx` ~line 336 | Update calendar grid to expand ranges |
| `src/App.jsx` ~line 439,462 | Add `start_date: null` to email inserts |
| `src/App.jsx` ~line 681 | Update card date display |
| `src/App.jsx` ~line 1036 | Add date range toggle to creation modal |
| `src/App.jsx` ~line 1072 | Update mobile detail panel |
| `src/App.jsx` ~line 1232 | Update desktop detail panel |

## Verification

1. Run migration in Supabase SQL Editor
2. `npm run dev` — create a task with no date range (should work as before)
3. Create a task with date range toggled on — verify both dates save and display as "Apr 9 – 13"
4. Open task detail, verify range fields appear and are editable
5. Switch to Calendar view — verify range task appears on all days in its range
6. Switch to Today view on a day within a range — verify task appears
7. Set a range ending in the past — verify overdue red styling
8. Set a range spanning today — verify active green styling
