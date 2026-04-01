// Daily newsletter capture script
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=... \
//   ANTHROPIC_API_KEY=... \
//   node scripts/capture-news.js
//
// Searches Gmail for today's newsletters from The Rundown AI, Superhuman AI,
// and TLDR Founders, extracts top 3 stories from each using Claude, and
// upserts them into tm_news_summaries.
//
// Prerequisites:
//   - Gmail API enabled in Google Cloud Console
//   - OAuth refresh token must include https://www.googleapis.com/auth/gmail.readonly scope
//     (re-run scripts/get-google-token.js after adding the scope)
//   - npm install @anthropic-ai/sdk

import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  ANTHROPIC_API_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error("Missing: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("Missing: ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oauth2 });

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SOURCES = [
  { name: "The Rundown AI", query: "from:rundown" },
  { name: "Superhuman AI", query: "from:superhuman" },
  { name: "TLDR Founders", query: "from:dan@tldrnewsletter.com" },
];

// ─── Gmail helpers ──────────────────────────────────────────────────────────

function getTodayQuery() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `after:${yyyy}/${mm}/${dd}`;
}

async function findTodaysEmail(sourceQuery) {
  const q = `${sourceQuery} ${getTodayQuery()}`;
  const res = await gmail.users.messages.list({ userId: "me", q, maxResults: 1 });

  if (!res.data.messages || res.data.messages.length === 0) return null;

  const msg = await gmail.users.messages.get({
    userId: "me",
    id: res.data.messages[0].id,
    format: "full",
  });

  return extractBody(msg.data);
}

function extractBody(message) {
  const parts = message.payload?.parts || [];
  // Try to find text/plain part first, then text/html
  for (const mimeType of ["text/plain", "text/html"]) {
    const part = parts.find((p) => p.mimeType === mimeType);
    if (part?.body?.data) {
      return Buffer.from(part.body.data, "base64url").toString("utf-8");
    }
    // Check nested parts (multipart/alternative inside multipart/mixed)
    for (const p of parts) {
      if (p.parts) {
        const nested = p.parts.find((np) => np.mimeType === mimeType);
        if (nested?.body?.data) {
          return Buffer.from(nested.body.data, "base64url").toString("utf-8");
        }
      }
    }
  }
  // Fallback: body directly on payload
  if (message.payload?.body?.data) {
    return Buffer.from(message.payload.body.data, "base64url").toString("utf-8");
  }
  return null;
}

// ─── Claude extraction ──────────────────────────────────────────────────────

async function extractStories(sourceName, emailBody) {
  // Truncate very long emails to stay within reasonable token limits
  const truncated = emailBody.length > 30000 ? emailBody.slice(0, 30000) : emailBody;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract the top 3 most important stories from this "${sourceName}" newsletter email.

For each story, provide:
- headline: a concise headline (under 100 chars)
- category: a 1-2 word tag like "Models", "Funding", "Agents", "Research", "Enterprise", "Open Source", "Startups", "Policy", "Tools"
- summary: exactly 1 sentence summarizing the story

Return ONLY valid JSON — no markdown, no backticks, no explanation. Format:
[{"headline": "...", "category": "...", "summary": "..."}]

Newsletter content:
${truncated}`,
      },
    ],
  });

  const text = response.content[0]?.text || "[]";
  // Extract JSON array from response (in case model wraps it)
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn(`  Could not parse stories from ${sourceName}`);
    return [];
  }

  try {
    const stories = JSON.parse(match[0]);
    return stories.slice(0, 3); // Ensure max 3
  } catch {
    console.warn(`  JSON parse error for ${sourceName}`);
    return [];
  }
}

// ─── Generate deterministic ID ──────────────────────────────────────────────

function storyId(source, headline, date) {
  // Simple hash: source + headline + date → base36 substring
  const str = `${source}|${headline}|${date}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `news_${Math.abs(hash).toString(36)}`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function capture() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`News capture starting — ${today}\n`);

  const allRows = [];

  for (const { name, query } of SOURCES) {
    console.log(`Searching: ${name}`);

    const body = await findTodaysEmail(query);
    if (!body) {
      console.log(`  No email found for today\n`);
      continue;
    }
    console.log(`  Found email (${body.length} chars)`);

    const stories = await extractStories(name, body);
    console.log(`  Extracted ${stories.length} stories`);

    for (const s of stories) {
      allRows.push({
        id: storyId(name, s.headline, today),
        source: name,
        headline: s.headline,
        category: s.category,
        summary: s.summary,
        story_date: today,
      });
    }
    console.log();
  }

  if (allRows.length === 0) {
    console.log("No stories to upsert.");
    return;
  }

  // Batch upsert all stories
  const { error } = await supabase
    .from("tm_news_summaries")
    .upsert(allRows, { onConflict: "source,headline,story_date" });

  if (error) {
    console.error(`Upsert error: ${error.message}`);
  } else {
    console.log(`Upserted ${allRows.length} stories into tm_news_summaries`);
  }

  console.log("\nCapture complete.");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
