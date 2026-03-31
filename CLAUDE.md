# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal task manager ("Lotus") — a React SPA with Supabase backend and Google Calendar integration, deployed on Vercel.

## Commands

```bash
npm run dev        # Vite dev server at localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

Database seeding:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... SEED_USER_ID=<uuid> node scripts/seed.js
```

No test framework is configured.

## Architecture

**Frontend:** Single monolithic React component in `src/App.jsx` (~24k lines). All views, state management, and UI logic live here with inline styles. No component library or CSS framework.

**Backend:** Serverless function at `api/gcal/events.js` handles Google Calendar sync via OAuth2 refresh token. Fetches from two calendars, caches results for 5 minutes. Deployed as a Vercel API route.

**Database:** Supabase (PostgreSQL) with four tables:
- `tm_projects` — project definitions with color
- `tm_tasks` — tasks with priority, due dates, subtasks, recurring flags, email source tracking
- `tm_email_tasks` — captured email tasks pending assignment
- `tm_calendar_events` — calendar events synced from GCal

All tables are scoped by `user_id` (UUID from `VITE_USER_ID` env var). Row-level security is enforced by Supabase.

**Views:** Tasks (grouped by project), Today, Calendar (month grid merging tasks + GCal events), Email Capture (batch assignment/dismissal).

**Data flow:** Optimistic UI updates with Supabase mutations. Calendar view merges local tasks, email tasks, GCal events, and DB calendar events into a unified month grid.

## Environment Variables

Frontend (VITE_ prefixed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USER_ID`

Server-only: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

See `.env.example` for the full template.

## Design System

- Warm cream/copper palette — primary text `#3D2E1E`, accent `#B5703A`, forest green `#2D4A35`
- Typography: Cormorant Garamond (serif headers), Jost (body), Syne (UI labels)
- Priority colors: Red=Urgent, Gold=High, Green=Medium, muted=None
- Mobile breakpoint at 768px
