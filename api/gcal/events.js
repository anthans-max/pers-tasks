import { google } from "googleapis";

// In-memory cache — survives warm lambda invocations (5-min TTL while debugging)
const cache = { data: null, ts: 0, month: null };
const CACHE_TTL = 5 * 60 * 1000;

const PRIMARY_ID = "anthans@gmail.com";
const SHARED_ID = "m8q4m4pbci3a481mo4tqjtvpms@group.calendar.google.com";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { month, bust } = req.query; // expected: "YYYY-MM"; bust=1 bypasses cache
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month param — expected YYYY-MM" });
  }

  const now = Date.now();

  if (!bust && cache.data && cache.month === month && now - cache.ts < CACHE_TTL) {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ events: cache.data, cached: true, lastFetch: cache.ts });
  }

  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return res.json({
        events: [],
        warning: "Google Calendar credentials not configured",
        lastFetch: null,
      });
    }

    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    const [year, mo] = month.split("-").map(Number);
    const mm = String(mo).padStart(2, "0");
    // Use plain UTC — avoids DST boundary issues with mixed offsets
    const timeMin = `${year}-${mm}-01T00:00:00Z`;
    const nextYear = mo === 12 ? year + 1 : year;
    const nextMo = String(mo === 12 ? 1 : mo + 1).padStart(2, "0");
    const timeMax = `${nextYear}-${nextMo}-01T00:00:00Z`; // exclusive start of next month

    const debugInfo = { timeMin, timeMax, primaryId: PRIMARY_ID, sharedId: SHARED_ID };

    const calendarList = [
      { id: PRIMARY_ID, source: "primary" },
      { id: SHARED_ID, source: "shared" },
    ];

    const rawCounts = {};
    const rawSamples = {};

    const fetched = await Promise.all(
      calendarList.map(async ({ id, source }) => {
        try {
          const resp = await calendar.events.list({
            calendarId: id,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
          });
          const items = resp.data.items || [];
          rawCounts[source] = items.length;
          rawSamples[source] = items.slice(0, 5).map((e) => ({
            summary: e.summary,
            start: e.start,
            id: e.id,
          }));
          return items.map((event) => ({
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
          rawCounts[source] = `ERROR: ${calErr.message}`;
          rawSamples[source] = [];
          return [];
        }
      })
    );

    const events = fetched.flat().filter((e) => e.date);

    cache.data = events;
    cache.ts = now;
    cache.month = month;

    res.setHeader("Cache-Control", "no-store");
    res.json({
      events,
      cached: false,
      lastFetch: now,
      debug: { ...debugInfo, rawCounts, rawSamples },
    });
  } catch (err) {
    console.error("[gcal] handler error:", err);
    res.json({ events: [], warning: err.message, lastFetch: null });
  }
}
