import { createClient } from "@supabase/supabase-js";

// Reuse the working /api/gcal/events endpoint for fetching, then upsert to Supabase.
// This avoids scope issues — /api/gcal/events already works with the existing token.

function transformEvent(event) {
  return {
    gcal_event_id: event.id,
    title: event.title || "(No title)",
    event_type: event.allDay ? "all_day" : "timed",
    start_date: event.date || null,
    end_date: event.endDate || null,
    calendar_source: event.calendarSource || "primary",
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase credentials not configured" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch events for current month and adjacent months via the working endpoint
    const now = new Date();
    const months = [];
    for (let offset = -1; offset <= 2; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    let allEvents = [];
    for (const month of months) {
      const url = `${baseUrl}/api/gcal/events?month=${month}&bust=1`;
      console.log(`[calendar/sync] fetching ${url}`);
      const resp = await fetch(url);
      const data = await resp.json();
      console.log(`[calendar/sync] month=${month}: ${data.events?.length ?? 0} events, warning=${data.warning || "none"}`);
      if (data.events) allEvents.push(...data.events);
    }
    console.log(`[calendar/sync] total=${allEvents.length}, unique after dedup:`);

    // Dedupe by event id + calendarSource
    const seen = new Set();
    const unique = allEvents.filter(e => {
      const key = `${e.id}_${e.calendarSource}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const rows = unique.map(transformEvent).filter(r => r.start_date);

    let upserted = 0;
    if (rows.length > 0) {
      // Batch in groups of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase
          .from("tm_calendar_events")
          .upsert(batch, { onConflict: "gcal_event_id,calendar_source" });
        if (error) throw new Error(`Upsert error: ${error.message}`);
        upserted += batch.length;
      }
    }

    res.json({ ok: true, results: [{ source: "all", fetched: unique.length, upserted }] });
  } catch (err) {
    console.error("[calendar/sync] error:", err);
    res.status(500).json({ error: err.message });
  }
}
