// Daily Google Calendar sync script
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=... \
//   node scripts/sync-gcal.js [--full]
//
// --full   Force a full sync (ignores and deletes saved syncTokens)
//
// Uses incremental sync (syncToken) when available, falls back to full sync.
// Batches upserts to Supabase for performance.

import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error("Missing: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oauth2 });

const CALENDARS = [
  { id: "anthans@gmail.com", source: "primary" },
  { id: "m8q4m4pbci3a481mo4tqjtvpms@group.calendar.google.com", source: "shared" },
];

const UPSERT_BATCH_SIZE = 50;
const FORCE_FULL = process.argv.includes("--full");

// ─── Sync token persistence ─────────────────────────────────────────────────

async function getSyncToken(calendarId) {
  if (FORCE_FULL) return null;

  const { data, error } = await supabase
    .from("tm_sync_tokens")
    .select("sync_token")
    .eq("calendar_id", calendarId)
    .maybeSingle();

  if (error) {
    console.warn(`  Could not read sync token for ${calendarId}: ${error.message}`);
    return null;
  }
  return data?.sync_token || null;
}

async function clearAllSyncTokens() {
  const { error } = await supabase
    .from("tm_sync_tokens")
    .delete()
    .in("calendar_id", CALENDARS.map((c) => c.id));

  if (error) {
    console.warn(`  Could not clear sync tokens: ${error.message}`);
  } else {
    console.log("Cleared saved syncTokens — forcing full sync\n");
  }
}

async function saveSyncToken(calendarId, syncToken) {
  const { error } = await supabase
    .from("tm_sync_tokens")
    .upsert(
      {
        calendar_id: calendarId,
        sync_token: syncToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "calendar_id" }
    );

  if (error) {
    console.error(`  Failed to save sync token for ${calendarId}: ${error.message}`);
  }
}

// ─── Fetch events (incremental or full) ──────────────────────────────────────

async function fetchEvents(calendarId, syncToken) {
  const allItems = [];
  let pageToken = null;
  let nextSyncToken = null;
  let isIncremental = !!syncToken;

  try {
    do {
      const params = {
        calendarId,
        singleEvents: true,
        maxResults: 250,
      };

      if (isIncremental && !pageToken) {
        // Incremental sync — use syncToken
        params.syncToken = syncToken;
      } else if (!isIncremental && !pageToken) {
        // Full sync — fetch 6 months back and 6 months forward
        const now = new Date();
        const past = new Date(now);
        past.setMonth(past.getMonth() - 6);
        const future = new Date(now);
        future.setMonth(future.getMonth() + 6);
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
      // 410 Gone — syncToken expired, fall back to full sync
      console.warn(`  syncToken expired for ${calendarId}, falling back to full sync`);
      return fetchEvents(calendarId, null);
    }
    throw err;
  }

  return { items: allItems, nextSyncToken, isIncremental };
}

// ─── Transform GCal event → DB row ──────────────────────────────────────────

function transformEvent(event, source) {
  const startDate = (event.start?.date || event.start?.dateTime || "").slice(0, 10);
  const endDate = (event.end?.date || event.end?.dateTime || "").slice(0, 10);
  const startTime = event.start?.dateTime
    ? event.start.dateTime.slice(11, 16)
    : null;
  const endTime = event.end?.dateTime
    ? event.end.dateTime.slice(11, 16)
    : null;

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

// ─── Batched upsert ─────────────────────────────────────────────────────────

async function batchUpsert(rows) {
  if (rows.length === 0) return { upserted: 0, errors: 0 };

  let upserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("tm_calendar_events")
      .upsert(batch, { onConflict: "gcal_event_id,calendar_source" });

    if (error) {
      console.error(`  Batch upsert error (rows ${i}–${i + batch.length}): ${error.message}`);
      errors += batch.length;
    } else {
      upserted += batch.length;
    }
  }

  return { upserted, errors };
}

// ─── Handle cancelled events (deletions from incremental sync) ───────────────

async function deleteCancelledEvents(cancelledIds, source) {
  if (cancelledIds.length === 0) return 0;

  const { error, count } = await supabase
    .from("tm_calendar_events")
    .delete({ count: "exact" })
    .eq("calendar_source", source)
    .in("gcal_event_id", cancelledIds);

  if (error) {
    console.error(`  Delete error: ${error.message}`);
    return 0;
  }
  return count || 0;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function sync() {
  console.log("Calendar sync starting\n");

  if (FORCE_FULL) {
    await clearAllSyncTokens();
  }

  for (const { id: calendarId, source } of CALENDARS) {
    console.log(`Syncing: ${source} (${calendarId})`);

    const syncToken = await getSyncToken(calendarId);
    console.log(`  Mode: ${syncToken ? "incremental" : "full"}`);

    const { items, nextSyncToken } = await fetchEvents(calendarId, syncToken);
    console.log(`  Fetched ${items.length} event(s)`);

    // Separate cancelled (deleted) events from active ones
    const cancelled = items.filter((e) => e.status === "cancelled");
    const active = items.filter((e) => e.status !== "cancelled");

    // Transform active events into DB rows
    const rows = active
      .map((e) => transformEvent(e, source))
      .filter((r) => r.start_date); // skip events with no parseable date

    // Batch upsert active events
    const { upserted, errors } = await batchUpsert(rows);
    console.log(`  Upserted: ${upserted}, errors: ${errors}`);

    // Delete cancelled events (only relevant for incremental sync)
    if (cancelled.length > 0) {
      const deleted = await deleteCancelledEvents(cancelled.map((e) => e.id), source);
      console.log(`  Deleted ${deleted} cancelled event(s)`);
    }

    // Save the new sync token
    if (nextSyncToken) {
      await saveSyncToken(calendarId, nextSyncToken);
      console.log(`  Saved new syncToken`);
    }

    console.log();
  }

  console.log("Sync complete.");
}

sync().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
