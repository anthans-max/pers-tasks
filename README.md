# Lotus List

Personal task manager built with React + Vite, backed by Supabase.

## Google Calendar Sync

The Calendar view can overlay events from your Google Calendars alongside tasks.

### Setup

**1. Create OAuth2 credentials**

- Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
- Create a project if you don't have one
- Click **Create Credentials → OAuth 2.0 Client ID**
- Application type: **Desktop app**
- Copy the **Client ID** and **Client Secret**

**2. Enable the Google Calendar API**

- Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
- Search "Google Calendar API" and click **Enable**

**3. Get your refresh token**

```bash
GOOGLE_CLIENT_ID=your_id GOOGLE_CLIENT_SECRET=your_secret node scripts/get-google-token.js
```

Visit the printed URL, grant calendar access, paste the auth code back. The script prints your `GOOGLE_REFRESH_TOKEN`.

**4. Add credentials to `.env.local`**

```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

**5. Set these same variables in Vercel**

In your Vercel project → Settings → Environment Variables, add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN`.

### How it works

- The Calendar view fetches `/api/gcal/events?month=YYYY-MM` on mount and on month navigation
- Events from both calendars are merged with tasks and displayed as colour-coded pills:
  - **Teal** — primary calendar (anthans@gmail.com)
  - **Purple** — shared calendar (Anthan & Saiyini)
  - **Gold** — birthdays and anniversaries (detected by title)
- Results are cached in-memory for 30 minutes to avoid redundant API calls
- If credentials are missing or the API call fails, the calendar falls back to tasks only with no error shown
- Use the **GCal** toggle button in the calendar header to show/hide Google Calendar events
