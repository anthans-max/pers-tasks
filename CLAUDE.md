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

**Backend:** Vercel serverless API routes:
- `api/gcal/events.js` — Google Calendar read endpoint (GET), fetches from two calendars, 5-min in-memory cache
- `api/calendar/sync.js` — Calendar sync (POST), fetches 4 months of events from primary + shared calendars, upserts to `tm_calendar_events`
- `api/email/capture.js` — Email capture (POST), searches Gmail for unread actionable emails, classifies with Claude, inserts to `tm_email_tasks`
- `api/news/capture.js` — News capture (POST), extracts top stories from newsletter emails (The Rundown AI, Superhuman AI, TLDR Founders) using Claude, upserts to `tm_news_summaries`

All sync endpoints use Google OAuth2 refresh token and have `maxDuration: 60` in `vercel.json`.

**Database:** Supabase (PostgreSQL) with five tables:
- `tm_projects` — project definitions with color
- `tm_tasks` — tasks with priority, due dates, subtasks, recurring flags, email source tracking
- `tm_email_tasks` — captured email tasks pending assignment
- `tm_calendar_events` — calendar events synced from GCal
- `tm_news_summaries` — AI-extracted newsletter stories with headline, category, summary, url

All tables are scoped by `user_id` (UUID from `VITE_USER_ID` env var) except `tm_news_summaries` and `tm_calendar_events`. Row-level security is enforced by Supabase.

**Views:** Tasks (grouped by project), Today, Calendar (month grid merging tasks + GCal events), Email Capture (batch assignment/dismissal), News (daily newsletter stories grouped by date).

**Data flow:** Optimistic UI updates with Supabase mutations. Calendar view merges local tasks, email tasks, GCal events, and DB calendar events into a unified month grid. Each view with external data has a "Sync Now" button that triggers the corresponding API route and shows a toast notification.

## Environment Variables

Frontend (VITE_ prefixed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USER_ID`

Server-only (Vercel env vars): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`

Google OAuth credentials are from the "Lotus List" project in Google Cloud Console (project 768511602941). The refresh token requires `calendar.readonly` and `gmail.readonly` scopes. Regenerate with `scripts/get-google-token.js`.

See `.env.example` for the full template.

## Design System

- Warm cream/copper palette — primary text `#3D2E1E`, accent `#B5703A`, forest green `#2D4A35`
- Typography: Cormorant Garamond (serif headers), Jost (body), Syne (UI labels)
- Priority colors: Red=Urgent, Gold=High, Green=Medium, muted=None
- Mobile breakpoint at 768px
- Header: "LotusList" brand with pill-shaped tab navigation (Tasks, Calendar, Emails, News, Finance)

## Scripts

- `scripts/get-google-token.js` — generates Google OAuth2 refresh token via localhost redirect (port 3333)
- `scripts/seed.js` — seeds Supabase with sample data
- `scripts/sync-gcal.js` — standalone calendar sync (local use)
- `scripts/capture-news.js` — standalone news capture (local use)

## SQL Migrations

Located in `sql/` directory. Run manually in Supabase SQL Editor.
- `002_news_summaries.sql` — creates `tm_news_summaries` table with RLS policy
