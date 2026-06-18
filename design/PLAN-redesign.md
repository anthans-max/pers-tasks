# Lotus List — Visual Redesign Plan

A phased restyle of `src/App.jsx` introducing a light/dark theme token layer, a single
sidebar-driven desktop nav, and a per-page visual refresh. **This is a RESTYLE** — every
Supabase query, sync handler, state value, and data-wiring path is preserved in every phase.

---

## Context

Lotus List is a personal task manager: a single ~1,860-line React component (`src/App.jsx`,
inline styles only), Supabase backend, deployed on Vercel. The redesign:

- Drops the **Finance** and **Ops** nav entries (they live externally at
  `ledger.getlotusai.com` / `ops.getlotusai.com`).
- Removes the top horizontal nav entirely; the **sidebar becomes the only desktop nav**.
- Implements a full **light/dark theme** via a 13-token CSS-custom-property layer.
- Rebuilds the sidebar (`#11201a`) and restyles Tasks, Calendar, Email Capture, and News.

### Locked decisions (do not revisit)

| Decision | Value |
|---|---|
| Finance nav | DROPPED (external: ledger.getlotusai.com) |
| Ops nav | DROPPED (external: ops.getlotusai.com) |
| Top horizontal nav | FULLY REMOVED — sidebar is the only desktop nav |
| Dark mode | IMPLEMENT — full two-theme token layer, toggled by `theme` state |
| Sidebar color | `#11201a` |
| Splash gate | `showMorning` gating preserved exactly as-is |

---

## Reconciliation note — spec vs. actual code

The original brief made several assumptions about the code that don't match reality. The
product decisions above stand; the **code-level facts** below are corrected so each phase is
directly executable.

| Brief said | Reality (verified in `src/App.jsx`) | Resolution |
|---|---|---|
| `page` state + setter | `view` / `setView`, `useState("tasks")` — **line 194** | Use `view`/`setView` everywhere |
| Finance/Ops are internal pages (`page==='finance'`) | They are **external-link tabs** inside `GoldBar`: Finance **778–781**, Ops **782–785**. No internal pages exist. | "Drop Finance/Ops" = delete those two `<a>`-wrapped `TabBtn`s (they vanish with `GoldBar`) |
| Remove "top horizontal nav" | It's the `GoldBar` component (**731–788**, tab row 767–786), rendered desktop-only at **1820** | Remove `GoldBar` + `TabBtn` (713) entirely |
| Add a new sidebar | `renderSidebar` already exists (**1396–1460**) with Views + dynamic Projects | Rebuild/restyle the existing `renderSidebar` |
| Add `isMobile` state @ 760px | `useIsMobile()` hook already exists (**178–186**, breakpoint **768**), consumed at **230** | Reuse the existing hook; keep 768 (760 vs 768 is negligible) |
| Sidebar = 6 hardcoded projects | Projects load from `tm_projects` → `projects` state → `sortedProjects` memo (**374–377**) | DB-driven via `sortedProjects` + a name→dot-color map, fallback to `proj.color` |
| `user_id` UUID concerns | `USER_ID` from `VITE_USER_ID` (**line 6**), plain text `"anthan"` in prod | Restyle only — never touch schema/queries |

**Preserved exactly in every phase:** `addTask` (**475**), the `showMorning` splash gate
(**1753**), all Supabase queries/handlers, `runSync` (**672–708**), the `calData` merge memo
(**396–472**), filter/grouping/count logic, and the standalone **`/quick-add`** page
(**1643–1741**) — which is already isolated and must NOT be themed or altered.

---

## Constraints

- `user_id` is plain text — never touch the Supabase schema.
- Styles are inline across the whole file; there is no central theme today. Phase 1 introduces
  the token layer as CSS custom properties on the root container.
- No router — view switching is React state (`view`, `showMorning`).
- `addTask` (~line 475) is preserved exactly, never edited.
- One phase at a time — do not batch; test after each phase before starting the next.
- The `/quick-add` page is independent (its own gold+green top bars and hardcoded styles) and
  is unaffected by this redesign.

---

## Design tokens (13) — apply as CSS custom properties

Driven by `theme` state (`'light'` | `'dark'`) via a `getThemeVars(theme)` helper that returns
a style object whose keys are the custom-property names.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--canvas` | `#f6f3ec` | `#0f140f` | Page background |
| `--sidebar` | `#11201a` | `#0a120c` | Sidebar / mobile header bg |
| `--card` | `#ffffff` | `#161c15` | Cards, inputs, calendar cells |
| `--hair` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.07)` | Card borders, dividers |
| `--hair2` | `rgba(0,0,0,0.11)` | `rgba(255,255,255,0.13)` | Stronger borders, chips, grid |
| `--ink` | `#22241b` | `#e2dfd5` | Primary body text |
| `--title` | `#1f2118` | `#f0ede6` | Serif headlines, stat numbers |
| `--muted` | `#8a8f80` | `rgba(240,237,230,0.5)` | Dates, metadata |
| `--muted2` | `#6b6f63` | `rgba(240,237,230,0.64)` | Group labels, news summaries |
| `--accent` | `#c4902a` | `#daa84a` | Gold — add button, open count, checkmarks |
| `--soft` | `#ece9e0` | `#20251e` | Chips, ✉ tile, weekday row, empty cells |
| `--pill` | `#11201a` | `#27392e` | Active chip, Sync Now, today circle |
| `--pillfg` | `#f0ede6` | `#f0ede6` | Text on pill backgrounds |

**Constants (never change with theme):** on-accent text `#0c0e0b`; sidebar fg primary
`#f0ede6`; sidebar nav idle `rgba(240,237,230,0.72)`; sidebar sub-labels
`rgba(240,237,230,0.45)`; sidebar gold marks `#daa84a`; high-priority checkbox ring `#b04a34`;
overdue date text `#c25c44`.

---

## Typography

Add to `index.html <head>` (one combined `<link>`, alongside the existing font + Tabler links):

```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap
```

| Use | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Page/view titles | Cormorant Garamond | 300 | 46px / lh 1 | `--title` |
| Calendar month | Cormorant Garamond | italic | 30px | `--title` |
| News headlines | Cormorant Garamond | 500 | 26px / lh 1.2 | `--title` |
| Stat numbers | Cormorant Garamond | 300 | 36px | TODAY/OPEN/EMAILS |
| Wordmark "LOTUS" | Cormorant Garamond | 500 | 27px | ls 0.05em, cream |
| Wordmark "LIST" | Cormorant Garamond | 500 italic | 27px | ls 0.05em, `#daa84a` |
| Task titles | DM Mono | 400 | 16px / lh 1.45 | `--ink` |
| Email subjects | DM Mono | 500 | 16px / lh 1.4 | `--ink` |
| News summaries | DM Mono | 400 | 13.5px / lh 1.75 | `--muted2` |
| Filter/nav pills | DM Mono | 400 | 12.5px | uppercase, ls 0.05em |
| Date eyebrow | DM Mono | 400 | 12px | uppercase, ls 0.12em, `--muted` |
| Group labels | DM Mono | 400 | 11px | uppercase, ls 0.16em, `--muted2` |
| Sub-labels | DM Mono | 400 | 9.5–10px | uppercase, ls 0.18–0.2em |
| Add task button | Syne | 700 | 14px | uppercase, ls 0.08em |

---

## Border-radius discipline (strict)

| `border-radius` | Applied to |
|---|---|
| `0` | ALL cards, inputs, headers, calendar cells, event chips, Sync Now, tag labels, task/email/news cards |
| `999px` | Filter chips, nav pills, Today pill, calendar nav arrows (use `50%`) |
| `6px` | Email checkbox ONLY |
| `50%` | Avatar, mobile FAB, calendar arrow buttons |

---

## Theme token-layer strategy (the load-bearing decision)

There is no theming today: `T` (lines **8–44**) is a single light palette consumed by ~340
inline styles referencing `T.*` directly, plus `PC`/`PG`/`PL` (46–48) and many hardcoded
literals. No `theme` state, no CSS custom properties anywhere.

**Approach — CSS custom properties injected on the root, JS palette kept light-only and
migrated per-phase.**

1. **`THEMES` + `getThemeVars`** (module level, near `T`): an object keyed by the 13
   custom-property names, with the exact light/dark values above. React serializes `--foo`
   style keys verbatim (no camelCasing, no px), so this is the correct mechanism.

   ```js
   const THEMES = {
     light: { "--canvas":"#f6f3ec", "--sidebar":"#11201a", "--card":"#ffffff",
       "--hair":"rgba(0,0,0,0.06)", "--hair2":"rgba(0,0,0,0.11)", "--ink":"#22241b",
       "--title":"#1f2118", "--muted":"#8a8f80", "--muted2":"#6b6f63",
       "--accent":"#c4902a", "--soft":"#ece9e0", "--pill":"#11201a", "--pillfg":"#f0ede6" },
     dark: { "--canvas":"#0f140f", "--sidebar":"#0a120c", "--card":"#161c15",
       "--hair":"rgba(255,255,255,0.07)", "--hair2":"rgba(255,255,255,0.13)", "--ink":"#e2dfd5",
       "--title":"#f0ede6", "--muted":"rgba(240,237,230,0.5)", "--muted2":"rgba(240,237,230,0.64)",
       "--accent":"#daa84a", "--soft":"#20251e", "--pill":"#27392e", "--pillfg":"#f0ede6" },
   };
   const getThemeVars = (theme) => THEMES[theme] || THEMES.light;
   ```

2. **State + persistence** (in `App`, near line 189–228):
   ```js
   const [theme, setTheme] = useState(() => localStorage.getItem("lotus-theme") || "light");
   useEffect(() => { localStorage.setItem("lotus-theme", theme);
     document.documentElement.setAttribute("data-theme", theme); }, [theme]);
   ```

3. **Apply tokens**: spread `getThemeVars(theme)` onto the two outermost render divs (desktop
   **1819**, mobile **1844**), and repoint `const base` (**1816**) to use tokens:
   `{ color:"var(--ink)", fontFamily:"'Jost', sans-serif", fontSize:14, background:"var(--canvas)" }`.
   Because the vars are declared on the same element that consumes them (and on all
   descendants), every `var(--token)` in the shell resolves.

4. **index.html**: the hardcoded `body { background:#FAF7F2 }` and scrollbar colors would flash
   light on dark reload (the app root doesn't paint during overscroll / before mount). Minimal
   fix — drive body + scrollbars from `:root` / `html[data-theme="dark"]` vars:
   ```css
   :root { --canvas:#f6f3ec; --scroll-thumb:#C8C2BA; --scroll-thumb-h:#A09890; }
   html[data-theme="dark"] { --canvas:#0f140f; --scroll-thumb:#2a322b; --scroll-thumb-h:#3c463d; }
   body { background: var(--canvas); font-family:'Jost', sans-serif; }
   ::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius:3px; }
   ::-webkit-scrollbar-thumb:hover { background: var(--scroll-thumb-h); }
   ```
   Optional pre-mount inline `<head>` script to kill the first-paint flash:
   `document.documentElement.setAttribute('data-theme', localStorage.getItem('lotus-theme')||'light')`.

5. **Migration rule (low-risk):** leave `T` as the light-only palette for un-migrated areas;
   write all new/restyled code against `var(--token)`; delete `T` keys opportunistically as
   each page migrates. **Do NOT repoint `T` → `var()` strings** — the 24 `T` keys don't map
   onto the 13 tokens, it breaks imperative `onMouse*` handlers that toggle between hex and a
   var, and it would render every un-restyled page "half-dark" (dark surfaces under
   light-tuned hardcoded literals) for the duration of the rollout.

6. **What "dark mode works after Phase 1" means:** the chrome (canvas, sidebar, nav, footer,
   splash, toasts, scrollbars, body) flips fully dark with no flash; page *content* (task feed,
   calendar grid, email/news lists) stays light — still on `T` — until its own phase. That's
   the expected, demoable intermediate state; each later phase darkens one more region.

### Gotchas

- **`Ico`** is module-level with `color=T.textSoft` (**111**). Switch its default to
  `currentColor` (icons inherit the styled parent's `color`) or pass `color="var(--muted)"`
  explicitly from migrated call sites. Don't leave a module-level `var()` default.
- **`GoldBar`/`TabBtn`** are removed; any replacement chrome must stay defined inside `App` so
  it can read `view`/`theme` and call `setView`/`setTheme`. The desktop content border at
  **1823** (`borderRight:1px solid ${T.borderS}`) is shell — migrate to `var(--hair2)` in P1.
- **Toasts** (`syncToast`, **1839/1858**) hardcode error red + `T.forest` success. Keep the
  error red literal (or add a `--danger` token); migrate success to `var(--pill)`. Shell → P1.
- **Morning splash** (**1753–1811**) uses `T.*` and imperative hover handlers
  (`e.currentTarget.style.background=T.forest`). Spread `getThemeVars(theme)` on the splash
  root and set hover handlers to `var(--pill)` / `var(--accent)`. Shell → P1.
- **`/quick-add`** (**1643–1741**): never spread `getThemeVars` onto its root and never convert
  its literals to `var()`. Leave it exactly as-is.

---

## Phase 1 — Token layer + shell

**Goal:** tokens + new chrome; all page content still renders via the existing `render*` fns.

- **1a — index.html:** add the combined Google Fonts `<link>`; add `:root` + `html[data-theme]`
  blocks and switch `body`/scrollbars to `var()`; (optional) pre-mount theme bootstrap script.
- **1b — App.jsx tokens:** add `THEMES` + `getThemeVars`; add `theme` state + persistence +
  `data-theme` effect; reuse existing `useIsMobile()` (768); spread `getThemeVars(theme)` on the
  desktop (1819) and mobile (1844) outer divs; repoint `base` (1816) to tokens.
- **1c — Remove top nav:** delete `GoldBar` (**731–788**), `TabBtn` (**713**), and the render at
  **1820**.
- **1d — Drop Finance/Ops:** the two external-link tabs die with `GoldBar`; grep to confirm no
  other references to `ledger.getlotusai.com` / `ops.getlotusai.com`.
- **1e — Rebuild `renderSidebar`** (**1396–1460**, `!isMobile`): 272px `var(--sidebar)` column,
  padding `28px 20px`, flex-column:
  - **Wordmark:** "LOTUS" (Cormorant 500/27px, ls .05em, `#f0ede6`) + italic "LIST" (`#daa84a`);
    subline "TASK MANAGER · 2026" (DM Mono 9.5px, ls .18em, `rgba(240,237,230,0.45)`).
  - **Profile chip:** 38px avatar circle (1px `#daa84a`, "A" Cormorant 19px `#daa84a`) + "Anthan"
    (Cormorant 18px `#f0ede6`) + "LOTUS LIST" (DM Mono 9.5px `rgba(240,237,230,0.45)`).
  - **Add task button:** 52px, `var(--accent)` bg, `#0c0e0b` text, Syne 700/14px uppercase ls
    .08em, label "＋ Add task"; click → if `view!=='tasks'` set `view='tasks'` then focus the
    quick-add input (`id="ls-qa-input"`), else just focus.
  - **VIEWS nav** (5 items → `setView`): All Tasks `tasks` (badge = open count, gold text),
    Today `today`, Calendar `calendar`, Email Capture `emails`→use existing `email` key, News
    `news` (badge = `emailTasks.length` for Email, in a 20px gold circle). Active:
    `rgba(196,144,42,0.18)` bg, `#f0ede6`; idle: transparent, `rgba(240,237,230,0.72)`.
  - **PROJECTS** (DB-driven): render `sortedProjects`; dot color from a name→color map
    `{General:#c4902a, "Lotus AI":#4a6fa5, "Sunder Med/Personal":#c97a3a, Personal:#2d5a38,
    "AaraSaan Consulting":#7a5a9a, COEO:#a8843a}` falling back to `proj.color`; count derived
    from `tasks` per `projectId`. Click sets `projectFilter` + `view='tasks'` (existing behavior).
  - **Theme toggle:** 42px, transparent, 1px `rgba(255,255,255,0.16)`, DM Mono 12px uppercase;
    "☾ Dark mode" → `setTheme('dark')` / "☀ Light mode" → `setTheme('light')`.
- **1f — Mobile shell** (`isMobile`): restyle `renderTopBar` (**1593–1616**) — row 1 wordmark +
  theme icon button + avatar; row 2 page title (Cormorant 300/32px) + subtitle. Restyle
  `renderBottomNav` (**1630–1640**) as the 5-slot tab bar (Tasks, Calendar, center gold FAB =
  goAdd, News, Inbox) — keep `setView` wiring; active text `var(--accent)`, idle `var(--muted2)`.

**Test gate:** toggle dark/light — all 13 tokens resolve, no flash, chrome fully dark; resize
across 768px — sidebar ↔ bottom nav; every page still renders through its existing `render*`.

---

## Phases 2–5 — restyle one page each (migrate `T.*` → `var()`)

Each phase: keep the named render fn's state reads and handler calls; rewrite only JSX/styles.

### Phase 2 — Tasks
- Fns: `renderFeed` (**886–956**), `renderFilterPills` (**986–1020**), `renderWeekStrip`
  (**958–984**), `renderSummaryCard` (**1618–1628**).
- Preserve: `visTasks` (379–391), `sortedProjects`, `toggleDone` (471+), sub-task state,
  `projectFilter`/`dayFilter`/`showCompleted`, the "Clear all" delete (`tm_tasks.delete().in`).
- Build: shared **content header** (Cormorant 300/46px title + DM Mono eyebrow + 3 stat blocks
  TODAY/OPEN/EMAILS, OPEN in `--accent`); filter chip row (active `--pill`/`--pillfg`, idle
  `--hair2` border → hover `--accent`); **quick-add bar** (`id="ls-qa-input"`, 58px, `--card`,
  Enter → existing `addTask`); task groups (dot + DM Mono 11px label + hairline + count);
  **task cards** (`--card`, `--hair` border, 26px checkbox: done `--accent`+✓, high-pri 2px
  `#b04a34` ring, normal `--muted` ring; title DM Mono 16px `--ink`, done → `--muted` +
  line-through; meta line with overdue `#c25c44` / on-time `--muted` / recurring `--accent` /
  sub-task count); empty state "Nothing here — you're all caught up. ❋".

### Phase 3 — Calendar
- Fn: `renderCalendar` (**1022–1111**). Preserve `calMonth` (**209**), prev/next/today
  (**1044–1047**), `gcalVisible` (1048) + `gcalFetchKey` (1053), the `calData` merge
  (**396–472**), `tm_calendar_events` read (**326–333**, fields incl. `event_type` /
  `calendar_source`), `runSync('calendar')`, recurring projection, declined filtering.
- Add `getEventFamily(event_type)` → `gold | green | slate | urgent` (map current values:
  `birthday`/`anniversary`/payday/payment/projected → gold; therapy/dental/appointment/health/
  etc. → green; class/shared/flight/external/etc. → slate; `urgent` → urgent;
  `calendar_source==='shared'` → slate; default slate). Tonal chip color tables per theme.
  Projected recurring events prefix title with "↻ ".
- Build: content header + "↻ Sync Now" (`--pill`); month nav row (‹/› 42px circles, Cormorant
  italic 30px month, Today pill); 7-col grid (`--hair2` borders, `--soft` weekday row + empty
  cells, `--card` day cells, radius 0; today number = 26px `--pill` circle; max 2 chips +
  "+N more"); legend row (4 swatches + "↻ Projected"); mobile agenda (big Cormorant day
  numbers, `border-left:3px` tonal rows).
- **Verify after build:** with live Supabase data, confirm chips land in the right families.

### Phase 4 — Email Capture
- Fn: `renderEmailView` (**1113–1168**). Preserve `emailTasks`, `tm_email_tasks`,
  `toggleEmailSelect` (**628**), `batchAssign` (**629–650**), `batchDismiss` (**651–657**),
  `assignEmail` (**609–627**), the `assigningEmail` modal (**1371–1384**).
- Build: header "Email Capture" + "· N TO TRIAGE" + Sync Now; cards (`--card`, `--hair`,
  `border-left:3px` tinted by priority/done; 26px **6px-radius** checkbox; 44px `--soft` ✉ tile;
  subject DM Mono 500/16px; from-chip `--soft` + priority label; "＋ Task" button wired to
  add-as-task); empty state "Inbox zero — every email triaged. ❋".

### Phase 5 — News
- Fn: `renderNewsView` (**1171–1227**). Preserve `newsSummaries`, `tm_news_summaries`,
  `runSync('news')`. Fields: `source`, `headline`, `category`, `summary`, `url`, `storyDate`.
- Add `getNewsSourceVariant(source)`: "TLDR" → neutral, "Rundown" → gold, "Superhuman" → green,
  default neutral (per-theme bg/text).
- Build: header + Sync Now; cards (`--card`, `--hair`, radius 0; tag row = source tag + category
  tag, radius 0; headline Cormorant 500/26px `--title`; summary DM Mono 13.5px `--muted2`).

---

## Implementation notes

- One prompt per phase — no batching; test after each.
- Phase 1 must land first (tokens before any page).
- Reference the exact identifiers/line numbers above when writing each phase's prompt.
- After Phase 1: test dark/light + mobile breakpoint.
- After Phase 3: verify event families against real `tm_calendar_events` data.
- `/quick-add` stays untouched throughout.

## Critical files

- `src/App.jsx` — tokens near 8–44; `theme`/`isMobile` near 189–230; `Ico` 111; `GoldBar`/
  `TabBtn` 713–788; `addTask` 475; `renderSidebar` 1396–1460; `renderTopBar` 1593–1616;
  `renderBottomNav` 1630–1640; render fns 886–1227; `base`/outer divs 1816–1859; splash
  1753–1811; `/quick-add` 1643–1741.
- `index.html` — fonts link (line 9), Tabler (line 10), `<style>` (11–20).

## Verification (per phase)

- **Build:** `npm run build` compiles clean.
- **Run:** `npm run dev`, exercise the changed view; confirm Supabase reads/writes still work
  (add a task, toggle done, sync, assign an email) — behavior identical to before.
- **Theme:** toggle dark/light; confirm tokens resolve and no light flash on reload.
- **Mobile:** resize past 768px; confirm sidebar ↔ bottom-nav swap.
- **Isolation:** confirm `/quick-add` is visually unchanged.
