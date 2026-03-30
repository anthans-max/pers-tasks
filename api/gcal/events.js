import { google } from "googleapis";

// In-memory cache — survives warm lambda invocations (30-min TTL)
const cache = { data: null, ts: 0, month: null };
const CACHE_TTL = 5 * 60 * 1000; // temporarily reduced to 5 min for verification

const PRIMARY_ID = "anthans@gmail.com";
const SHARED_ID = "m8q4m4pbci3a481mo4tqjtvpms@group.calendar.google.com";

// Returns the UTC offset string for America/Los_Angeles at a given moment, e.g. "-07:00" or "-08:00"
function getLAOffsetString(date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT-7";
  const match = tzPart.match(/GMT([+-])(\d+)/);
  if (!match) return "-07:00";
  return `${match[1]}${String(match[2]).padStart(2, "0")}:00`;
}

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { month, bust } = req.query; // expected: "YYYY-MM"; bust=1 bypasses cache
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month param — expected YYYY-MM" });
  }

  const now = Date.now();

  // Return cached data if still fresh and same month (unless cache-bust requested)
  if (!bust && cache.data && cache.month === month && now - cache.ts < CACHE_TTL) {
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
    const lastDay = new Date(year, mo, 0).getDate(); // last day of month

    // Use explicit America/Los_Angeles offset so timeMin/timeMax match local midnight
    const startOffset = getLAOffsetString(new Date(year, mo - 1, 1));
    const endOffset = getLAOffsetString(new Date(year, mo - 1, lastDay));
    const mm = String(mo).padStart(2, "0");
    const timeMin = `${year}-${mm}-01T00:00:00${startOffset}`;
    const timeMax = `${year}-${mm}-${String(lastDay).padStart(2, "0")}T23:59:59${endOffset}`;

    const debugInfo = { timeMin, timeMax, calendars: [PRIMARY_ID, SHARED_ID] };
    console.log("[gcal] request debug:", debugInfo);

    const calendars = [
      { id: PRIMARY_ID, source: "primary" },
      { id: SHARED_ID, source: "shared" },
    ];

    const rawCounts = {};
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
          const items = resp.data.items || [];
          rawCounts[source] = items.length;
          console.log(`[gcal] calendar=${source} (${id}) raw items=${items.length}`);
          if (items.length) console.log(`[gcal] ${source} sample:`, items.slice(0,3).map(e => ({ summary: e.summary, start: e.start })));
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
          console.error(`[gcal] failed to fetch calendar ${id}:`, calErr.message);
          return [];
        }
      })
    );

    const events = fetched.flat().filter((e) => e.date);
    console.log(`[gcal] total events after flatten+filter: ${events.length}`);

    // Update cache
    cache.data = events;
    cache.ts = now;
    cache.month = month;

    res.setHeader("Cache-Control", "no-store");
    res.json({ events, cached: false, lastFetch: now, debug: { ...debugInfo, rawCounts } });
  } catch (err) {
    console.error("[gcal] handler error:", err);
    res.json({ events: [], warning: err.message, lastFetch: null });
  }
}
