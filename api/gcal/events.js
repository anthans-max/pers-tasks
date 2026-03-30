import { google } from "googleapis";

// In-memory cache — survives warm lambda invocations (30-min TTL)
const cache = { data: null, ts: 0, month: null };
const CACHE_TTL = 5 * 60 * 1000; // temporarily reduced to 5 min for verification

const PRIMARY_ID = "primary";
const SHARED_ID = "m8q4m4pbci3a481mo4tqjtvpms@group.calendar.google.com";

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { month } = req.query; // expected: "YYYY-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month param — expected YYYY-MM" });
  }

  const now = Date.now();

  // Return cached data if still fresh and same month
  if (cache.data && cache.month === month && now - cache.ts < CACHE_TTL) {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ events: cache.data, cached: true, lastFetch: cache.ts });
  }

  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return res.json({
        events: [],
        warning: "Google Calendar credentials not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN",
        lastFetch: null,
      });
    }

    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    const [year, mo] = month.split("-").map(Number);
    const timeMin = new Date(year, mo - 1, 1).toISOString();
    const timeMax = new Date(year, mo, 0, 23, 59, 59).toISOString();

    const calendars = [
      { id: PRIMARY_ID, source: "primary" },
      { id: SHARED_ID, source: "shared" },
    ];

    const fetched = await Promise.all(
      calendars.map(async ({ id, source }) => {
        try {
          const resp = await calendar.events.list({
            calendarId: id,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
          });
          return (resp.data.items || []).map((event) => ({
            id: event.id,
            title: event.summary || "(No title)",
            date: (event.start?.date || event.start?.dateTime || "").slice(0, 10),
            endDate: (event.end?.date || event.end?.dateTime || "").slice(0, 10),
            allDay: !!event.start?.date,
            type: "gcal",
            calendarSource: source,
            isRecurring: !!event.recurringEventId,
          }));
        } catch (calErr) {
          console.error(`[gcal] failed to fetch calendar ${id}:`, calErr.message);
          return [];
        }
      })
    );

    const events = fetched.flat().filter((e) => e.date);

    // Update cache
    cache.data = events;
    cache.ts = now;
    cache.month = month;

    res.setHeader("Cache-Control", "no-store");
    res.json({ events, cached: false, lastFetch: now });
  } catch (err) {
    console.error("[gcal] handler error:", err);
    res.json({ events: [], warning: err.message, lastFetch: null });
  }
}
