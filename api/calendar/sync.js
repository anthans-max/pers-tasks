import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const PRIMARY_ID = "anthans@gmail.com";
const SHARED_ID = "m8q4m4pbci3a481mo4tqjtvpms@group.calendar.google.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
    SUPABASE_URL, SUPABASE_SERVICE_KEY,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return res.status(500).json({ error: "Google credentials not configured" });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase credentials not configured" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Exact same auth pattern as api/gcal/events.js (which works)
    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    // Fetch 4 months of events (current ± 1 month + 2 ahead)
    const now = new Date();
    const months = [];
    for (let offset = -1; offset <= 2; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const mm = String(m + 1).padStart(2, "0");
      const nextM = m === 11 ? 1 : m + 2;
      const nextY = m === 11 ? y + 1 : y;
      months.push({
        timeMin: `${y}-${mm}-01T00:00:00Z`,
        timeMax: `${nextY}-${String(nextM).padStart(2, "0")}-01T00:00:00Z`,
      });
    }

    const calendarList = [
      { id: PRIMARY_ID, source: "primary" },
      { id: SHARED_ID, source: "shared" },
    ];

    let allRows = [];

    for (const { id: calendarId, source } of calendarList) {
      for (const { timeMin, timeMax } of months) {
        try {
          const resp = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
          });

          const items = resp.data.items || [];
          console.log(`[calendar/sync] ${source} ${timeMin.slice(0,7)}: ${items.length} events`);

          for (const event of items) {
            if (event.status === "cancelled") continue;
            const startDate = (event.start?.date || event.start?.dateTime || "").slice(0, 10);
            if (!startDate) continue;

            allRows.push({
              gcal_event_id: event.id,
              title: event.summary || "(No title)",
              event_type: event.start?.date ? "all_day" : "timed",
              start_date: startDate,
              end_date: (event.end?.date || event.end?.dateTime || "").slice(0, 10),
              start_time: event.start?.dateTime ? event.start.dateTime.slice(11, 16) : null,
              end_time: event.end?.dateTime ? event.end.dateTime.slice(11, 16) : null,
              calendar_source: source,
              location: event.location || null,
              description: (event.description || "").slice(0, 500) || null,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch (calErr) {
          console.error(`[calendar/sync] error fetching ${source} ${timeMin.slice(0,7)}: ${calErr.message}`);
        }
      }
    }

    // Dedupe by gcal_event_id + calendar_source
    const seen = new Set();
    const unique = allRows.filter(r => {
      const key = `${r.gcal_event_id}_${r.calendar_source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let upserted = 0;
    if (unique.length > 0) {
      for (let i = 0; i < unique.length; i += 50) {
        const batch = unique.slice(i, i + 50);
        const { error } = await supabase
          .from("tm_calendar_events")
          .upsert(batch, { onConflict: "gcal_event_id,calendar_source" });
        if (error) throw new Error(`Upsert error: ${error.message}`);
        upserted += batch.length;
      }
    }

    console.log(`[calendar/sync] done: ${unique.length} fetched, ${upserted} upserted`);
    res.json({ ok: true, results: [{ source: "all", fetched: unique.length, upserted }] });
  } catch (err) {
    console.error("[calendar/sync] error:", err);
    res.status(500).json({ error: err.message });
  }
}
