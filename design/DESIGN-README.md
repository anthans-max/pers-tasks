# Handoff: LotusList — Task Manager UI (Refined Light + Dark)

## Overview
LotusList is a personal task manager with four primary views — **Tasks, Calendar, Email Capture, and News** — plus a quick-add flow and a light/dark theme toggle. This handoff covers a full visual refresh ("Refined Light" direction) of an existing product: larger type, bigger tap targets, more breathing room, a mobile layout, and a premium color system (forest-green chrome, warm off-white canvas, single gold accent, tonal calendar palette).

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, layout, and behavior. They are **not production code to copy directly**.

- `LotusList.dc.html` — the source prototype. It is authored for a bespoke streaming component runtime (a `<x-dc>` template + a `class Component` logic block). **Do not try to reuse that runtime.** Read it for structure, exact inline styles, copy, and the data/derivation logic in `renderVals()`.
- `LotusList.html` — a self-contained bundled build of the same prototype. Open it in a browser to interact with the real thing (toggle theme, switch views, check tasks/emails, quick-add, filter). Use this as the source of truth for behavior.

**The task is to recreate these designs in the target codebase's existing environment** (the original product is **Next.js 16 / React 19 / Tailwind 4 / framer-motion** — see "Origin codebase" below) using its established patterns and component conventions. If starting fresh, React + CSS variables for theming is the natural fit.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are all specified below and present in the HTML. Recreate pixel-faithfully using the codebase's existing libraries. The one simplification: month-navigation arrows, "Today", and "Sync Now" buttons are visual-only in the prototype (no wired behavior) — implement them for real.

## Origin codebase (Lotus AI design system)
The product sits inside the **Lotus AI** marketing/design system. Reuse these where they already exist:
- **Fonts** (Google Fonts): **Cormorant Garamond** (300/400/500/600, display serif — page titles, view headlines, news headlines, the "List" wordmark), **DM Mono** (300/400/500 — body, metadata, labels, eyebrows, UI), **Syne** (700/800 — the "Add task" button label, wordmark mass), **Hanken Grotesk** (400–700 — used only in the comparison/intro copy; not required in the app itself).
- **Brand glyph**: `❋` (U+274B) used as the empty-state mark and decorative eyebrow lead-in.
- **Radii**: sharp. Cards, inputs, headers, calendar cells are all `border-radius: 0`. The only rounded things are: filter/nav pills (`999px`), avatar + checkbox circles (`50%`), the email checkbox (`6px`), and the email "✉" tile (square). Keep this discipline — rounded corners cheapen the brand.

---

## Design Tokens

### Theme system
Everything themeable is a CSS custom property set on the app root; child styles reference `var(--token)`. Two themes:

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--canvas` | `#f6f3ec` | `#0f140f` | page background (main content area) |
| `--sidebar` | `#11201a` | `#0a120c` | left sidebar + mobile header background |
| `--card` | `#ffffff` | `#161c15` | task/email/news cards, inputs, calendar cells |
| `--hair` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.07)` | card borders, group dividers, header underline |
| `--hair2` | `rgba(0,0,0,0.11)` | `rgba(255,255,255,0.13)` | stronger borders (chips, calendar grid, buttons) |
| `--ink` | `#22241b` | `#e2dfd5` | primary body text (task/email titles) |
| `--title` | `#1f2118` | `#f0ede6` | serif headlines, stat numbers, calendar day-of-month |
| `--muted` | `#8a8f80` | `rgba(240,237,230,0.5)` | secondary metadata, dates, sub-labels |
| `--muted2` | `#6b6f63` | `rgba(240,237,230,0.64)` | group labels, counts, news summary text |
| `--accent` | `#c4902a` | `#daa84a` | gold — add button, open-count, checkmarks, recurring ↻, active mobile-nav |
| `--soft` | `#ece9e0` | `#20251e` | email "from" chips, ✉ tile, calendar weekday header + empty cells |
| `--pill` | `#11201a` | `#27392e` | active filter chip + "Sync Now" + today circle background |
| `--pillfg` | `#f0ede6` | `#f0ede6` | text on `--pill` |

Constants (do **not** change with theme):
- On-accent text: `#0c0e0b` (e.g. black "✓" / "＋" on gold).
- Sidebar foreground is always warm cream: `#f0ede6` (primary), `rgba(240,237,230,0.72)` (nav idle), `rgba(240,237,230,0.45)` (sub-labels), `#daa84a` (gold marks). Sidebar reads on dark green in both themes.
- Wordmark italic + avatar ring gold in sidebar: `#daa84a`.
- High-priority checkbox ring: `#b04a34` (brick red, both themes).
- Overdue date text: `#c25c44` (light) — slightly brighter than the ring so it reads on cream.

### Calendar event palette — "Tonal Trio" (intentional: only 3 hues + red)
Events map to one of four families by type. Keep saturation low; this restraint is the premium signal (avoid a rainbow of categories).

| Family | Light bg / border / text | Dark bg / border / text | Event types mapped |
|---|---|---|---|
| **green** (health) | `#e4ece2` / `#3f7d5a` / `#2f5a40` | `#1a2a20` / `#4f8d6a` / `#9cc4ac` | therapy, dental, appointments, camps, outings |
| **gold** (finance & birthdays) | `#f3ead3` / `#c4902a` / `#8a6312` | `#2a2417` / `#c4902a` / `#d8b471` | birthdays, paydays, payments, "projected" recurring |
| **slate** (shared / external) | `#e6e8ea` / `#6b7785` / `#46505c` | `#20242a` / `#7b889a` / `#aeb6c2` | classes, cleanings, land updates, flights |
| **urgent** (red) | `#f3e0da` / `#b04a34` / `#8a3422` | `#2e1d18` / `#c46a52` / `#d99b86` | reserved for urgent items |

Type→family map: `green→green`, `gold→gold`, `projected→gold`, `birthday→gold`, `shared→slate`, `flight→slate`, `urgent→urgent`. "Projected" (recurring) events get a `↻ ` prefix on the title. Event chip = `border-left: 2px solid <border>`, `background: <bg>`, `color: <text>`, single-line with ellipsis.

### News source-tag palette
| Source key | Light bg / text | Dark bg / text |
|---|---|---|
| neutral (TLDR Founders) | `#ebe9e2` / `#5a5d52` | `#24251f` / `#b6b3a6` |
| gold (The Rundown AI) | `#f3ead3` / `#a8843a` | `#2a2417` / `#d8b471` |
| green (Superhuman AI) | `#e4ece2` / `#2f5a40` | `#1a2a20` / `#9cc4ac` |

### Project dot colors (sidebar legend, fixed)
General `#c4902a` · Lotus AI `#4a6fa5` · Sunder Med/Personal `#c97a3a` · Personal `#2d5a38` · AaraSaan Consulting `#7a5a9a` · COEO `#a8843a`. Task-group accent dots reuse the first three.

### Email priority colors
High `#b04a34` (light) / `#d27a60` (dark) · Medium `#a8843a` (light) / `#d8b471` (dark).

### Typography scale (exact)
- Page/view title (serif): Cormorant Garamond 300, **46px**/1, desktop; **32–34px** mobile.
- Stat numbers (serif): Cormorant 300/400–500, **36px** (gold for "open").
- Calendar month: Cormorant **italic 30px**.
- News headline: Cormorant 500, **26px**/1.2 (22px mobile).
- Wordmark: Cormorant 500, **27px**, letter-spacing 0.05em ("LIST" italic gold).
- Task title: **DM Mono 16px**/1.45.
- Email subject: DM Mono 500, **16px**/1.4.
- News summary: DM Mono **13.5px**/1.75, `--muted2`.
- Filter / nav-pill text: DM Mono **12.5px**, uppercase, letter-spacing 0.05em.
- Group labels & eyebrows: DM Mono **11px**, uppercase, letter-spacing 0.14–0.16em, `--muted2`.
- Date sub-line: DM Mono **12.5px**, `--muted` (overdue `#c25c44`).
- Add-task button: Syne 700, **14px**, uppercase, letter-spacing 0.08em.
- Sub-labels / status: DM Mono 9.5–10px, letter-spacing 0.18–0.2em.

### Spacing & sizing
- Sidebar width **272px** (desktop); main content header padding `30px 44px 18px`; content gutters `44px` desktop / `16–18px` mobile.
- Add-task button height **52px**; quick-add bar height **58px**; filter pills height **44px** (42 mobile); "Sync Now" / calendar nav buttons height **46px** / 42px.
- Checkboxes: tasks **26px** desktop / **30px** mobile (circle, 1.5px border; high-priority 2px `#b04a34`); email **26–28px** rounded-6px square.
- Cards: 1px `--hair` border, padding `17px 20px` (tasks) / `20px 22px` (email) / `24px 26px` (news); 8–14px gaps.
- Calendar cell min-height **124px**, 7-col CSS grid, 1px `--hair2` gridlines; today = 26px `--pill` circle with `--pillfg` number.
- Mobile breakpoint: **< 760px** switches to the mobile layout. Mobile bottom nav height **84px** with a centered 56px gold FAB (offset up 22px).
- Shadows: cards use hover-only `0 4px 16px rgba(0,0,0,0.10)`; mobile FAB `0 6px 18px rgba(196,144,42,0.4)`.

---

## Screens / Views

All views share: a **left sidebar** (desktop) / **dark green header + bottom tab bar** (mobile), and a content header (`<serif title>` + `<DM Mono eyebrow date>`).

### Sidebar (desktop, persistent)
Top→bottom: wordmark **LOTUS·LIST** + "TASK MANAGER · 2026"; profile chip (avatar "A" gold-ring circle + "Anthan" / "LOTUS LIST", 1px border box); **＋ Add task** (gold, Syne); **VIEWS** group → All Tasks (badge = open count, gold text), Today, Calendar, Email Capture (badge "3" in a 20px gold pill), News — active item has `rgba(196,144,42,0.18)` background + cream text; **PROJECTS** group → 6 color-dot rows with counts; footer **theme toggle** button (outline, "☾ Dark mode" / "☀ Light mode"). Nav items must be real `<button>`s with click handlers.

### 1. Tasks ("All Tasks")
- **Purpose**: review, complete, filter, and quick-add tasks.
- **Header**: "All Tasks" + "WEDNESDAY, JUNE 17, 2026"; right side three stats — TODAY `0`, OPEN `<count>` (gold), EMAILS `3`.
- **Filter chips** (pill row): All · General · Lotus AI · Sunder Med/Personal · Completed (Completed shows a count). Active chip = `--pill`/`--pillfg`; idle = transparent w/ `--hair2` border, hover→accent.
- **Quick-add bar**: gold "＋" circle + input "Add a task to General…   press Enter to save". Enter prepends a new task to **General** (open), clears input. Sidebar "Add task" and mobile FAB focus this input (switching to Tasks first if needed).
- **Task groups**: dot + uppercase group label + hairline + count, then cards. Card = checkbox + title + optional meta line (date / `↻ Monthly` / `N subtasks`). Completing toggles `done`: checkbox becomes a gold "✓" circle, title goes `--muted` + line-through, and the row leaves the active (non-Completed) lists. Completed filter lists done items.
- **Empty state**: centered "Nothing here — you're all caught up. ❋".

### 2. Calendar
- **Purpose**: month overview of events.
- **Header**: "Calendar" + date; right: **↻ Sync Now** (`--pill` pill).
- **Controls row**: ‹ circle button · **June 2026** (Cormorant italic) · › circle button · **Today** pill. (Arrows/Today/Sync visual-only in mock — wire them.)
- **Grid**: weekday header (SUN…SAT, `--soft` bg) over a 7-col grid. June 2026 starts Monday → 1 leading empty cell, days 1–30, trailing empties to fill 35 (5 rows). Each day cell: day number (today = `--pill` circle), up to 2 event chips (tonal palette), then "+N more". Empty cells use `--soft` at 0.5 opacity.
- **Legend**: Health · Finance & birthdays · Shared / external · Urgent · "↻ Projected".
- **Mobile**: replaced by an **agenda list** — for each upcoming day with events (17→30), a big serif day number + "WEEKDAY · JUN" (+ "Today" tag), then full-width event rows (left-border colored by family).

### 3. Email Capture
- **Purpose**: triage inbound emails into tasks.
- **Header**: "Email Capture" + "… · `<N>` TO TRIAGE"; right: **↻ Sync Now**.
- **Rows** (cards, `border-left: 3px` colored by priority): rounded-6px checkbox + 44px `--soft` ✉ tile + subject (DM Mono 16/500) + meta ("From: `<sender>`" chip on `--soft` + uppercase priority in its color) + a right-aligned **＋ Task** outline button. Checking marks it done (gold ✓, line-through, accent→muted border). Empty: "Inbox zero — every email triaged. ❋".
- **Seed data**: (1) "Follow up on Dr. Sunder course reschedule request" — Scott Manze — High; (2) "Renew Amazon Music Unlimited subscription or take action on lapsed account" — Amazon Music — Medium; (3) "Renew vehicle registration with DMV" — NO-REPLY@enotices.dmvonline.ca.gov — High.

### 4. News
- **Purpose**: AI-industry headline feed.
- **Header**: "News" + date; right: **↻ Sync Now**.
- **Cards**: source tag (colored by source) + category tag (outline) row, then **Cormorant 26px headline**, then DM Mono 13.5px summary (`--muted2`). Whole card hover-elevates. Seven seed articles (verbatim text in the HTML `rawNews` array).

---

## Interactions & Behavior
- **View switching**: sidebar VIEWS buttons (desktop) and bottom-tab buttons (mobile) set `page` ∈ {tasks, today, calendar, emails, news}. "Today" currently renders the Tasks view.
- **Theme toggle**: flips `theme` ∈ {light, dark}; re-resolves all `var(--*)` tokens + the data-derived palettes (calendar chips, news tags, priority colors, email/task title colors). Instant, no transition required (a 150–200ms color transition is a nice touch).
- **Quick-add**: Enter on the quick-add input prepends a task; sidebar/FAB add buttons focus it.
- **Complete task / capture email**: toggles a `done` boolean → visual done state + list membership changes.
- **Filters**: chips set `filter`; groups recompute. "Completed" shows done tasks only.
- **Hover**: cards raise a soft shadow + border darkens; idle pills/buttons gain an accent border; nav/list text warms toward `--title`.
- **Responsive**: single breakpoint at 760px. Desktop = sidebar + main; mobile = green header + scrollable content + fixed bottom tab bar with center gold FAB.

## State Management
- `theme: 'light' | 'dark'`
- `page: 'tasks' | 'today' | 'calendar' | 'emails' | 'news'`
- `filter: 'All' | 'General' | 'Lotus AI' | 'Sunder Med/Personal' | 'Completed'`
- `isMobile: boolean` (from a window-resize listener, threshold 760)
- `tasks: [{ id, group, title, date?, overdue?, high?, recurring?, meta?, done? }]`
- `emails: [{ id, subject, from, priority: 'High'|'Medium', done? }]`
- Calendar events and news are static data (see `E` and `rawNews` in the HTML). All display values (grouped/filtered tasks, calendar cells, agenda, themed colors, nav active states, page title/subtitle) are **derived** — see `renderVals()` for the exact derivations.

## Assets
No raster/vector asset files. The logo is rendered as a **type wordmark** (Cormorant). Icons are Unicode glyphs (`❋ ↻ ✓ ＋ ☰ ▦ ▤ ✉ ‹ › ☾ ☀`). If the target codebase has an icon set, swap the Unicode glyphs for equivalents (the brand otherwise avoids an icon library). Fonts load from Google Fonts.

## Screenshots
Reference renders (desktop) in `screenshots/`:
- `01-tasks-light.png` · `02-calendar-light.png` · `03-emails-light.png` · `04-news-light.png`
- `05-tasks-dark.png` · `06-calendar-dark.png` · `07-emails-dark.png` · `08-news-dark.png`

These are static captures; open `LotusList.html` for the interactive source of truth (hover states, mobile layout, quick-add).

## Files
- `LotusList.dc.html` — source prototype (custom runtime; read for exact styles, copy, and `renderVals()` derivation logic).
- `LotusList.html` — self-contained interactive build; open in a browser to verify behavior, theming, and responsive layout.
- `screenshots/` — 8 desktop reference renders (4 views × light/dark).
