import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const CALENDARS = [
  { id: "anthans@gmail.com", source: "primary" },
  { id: "m8q4m4pbci3a481mo4tqjtvpms@group.calendar.google.com", source: "shared" },
];

function transformEvent(event, source) {
  const startDate = (event.start?.date || event.start?.dateTime || "").slice(0, 10);
  const endDate = (event.end?.date || event.end?.dateTime || "").slice(0, 10);
  const startTime = event.start?.dateTime ? event.start.dateTime.slice(11, 16) : null;
  const endTime = event.end?.dateTime ? event.end.dateTime.slice(11, 16) : null;

  return {
    gcal_event_id: event.id,
    title: event.summary || "(No title)",
    description: event.description || null,
    event_type: event.start?.date ? "all_day" : "timed",
    start_date: startDate || null,
    end_date: endDate || null,
    start_time: startTime,
    end_time: endTime,
    calendar_source: source,
    location: event.location || null,
    is_recurring: !!event.recurringEventId,
    status: event.status || "confirmed",
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

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

    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    const now = new Date();
    const past = new Date(now); past.setMonth(past.getMonth() - 1);
    const future = new Date(now); future.setMonth(future.getMonth() + 3);

    const results = [];

    for (const { id: calendarId, source } of CALENDARS) {
      // Check for sync token
      const { data: tokenRow } = await supabase
        .from("tm_sync_tokens")
        .select("sync_token")
        .eq("calendar_id", calendarId)
        .maybeSingle();

      const syncToken = tokenRow?.sync_token || null;
      let isIncremental = !!syncToken;
      let allItems = [];
      let nextSyncToken = null;

      try {
        let pageToken = null;
        do {
          const params = { calendarId, singleEvents: true, maxResults: 250 };
          if (isIncremental && !pageToken) {
            params.syncToken = syncToken;
          } else if (!isIncremental && !pageToken) {
            params.timeMin = past.toISOString();
            params.timeMax = future.toISOString();
            params.orderBy = "startTime";
          }
          if (pageToken) params.pageToken = pageToken;

          const resp = await calendar.events.list(params);
          allItems.push(...(resp.data.items || []));
          pageToken = resp.data.nextPageToken || null;
          nextSyncToken = resp.data.nextSyncToken || null;
        } while (pageToken);
      } catch (err) {
        if (err.code === 410 && isIncremental) {
          // syncToken expired — full sync
          isIncremental = false;
          let pageToken = null;
          do {
            const params = {
              calendarId, singleEvents: true, maxResults: 250,
              timeMin: past.toISOString(), timeMax: future.toISOString(),
              orderBy: "startTime",
            };
            if (pageToken) params.pageToken = pageToken;
            const resp = await calendar.events.list(params);
            allItems.push(...(resp.data.items || []));
            pageToken = resp.data.nextPageToken || null;
            nextSyncToken = resp.data.nextSyncToken || null;
          } while (pageToken);
        } else {
          throw err;
        }
      }

      const cancelled = allItems.filter(e => e.status === "cancelled");
      const active = allItems.filter(e => e.status !== "cancelled");
      const rows = active.map(e => transformEvent(e, source)).filter(r => r.start_date);

      let upserted = 0, deleted = 0;

      if (rows.length > 0) {
        const { error } = await supabase
          .from("tm_calendar_events")
          .upsert(rows, { onConflict: "gcal_event_id,calendar_source" });
        if (error) throw new Error(`Upsert error (${source}): ${error.message}`);
        upserted = rows.length;
      }

      if (cancelled.length > 0) {
        const { count } = await supabase
          .from("tm_calendar_events")
          .delete({ count: "exact" })
          .eq("calendar_source", source)
          .in("gcal_event_id", cancelled.map(e => e.id));
        deleted = count || 0;
      }

      if (nextSyncToken) {
        await supabase.from("tm_sync_tokens").upsert({
          calendar_id: calendarId,
          sync_token: nextSyncToken,
          updated_at: new Date().toISOString(),
        }, { onConflict: "calendar_id" });
      }

      results.push({
        source, mode: isIncremental ? "incremental" : "full",
        fetched: allItems.length, upserted, deleted,
      });
    }

    res.json({ ok: true, results });
  } catch (err) {
    console.error("[calendar/sync] error:", err);
    res.status(500).json({ error: err.message });
  }
}
