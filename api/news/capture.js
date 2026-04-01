import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const SOURCES = [
  { name: "The Rundown AI", query: "from:rundown" },
  { name: "Superhuman AI", query: "from:superhuman" },
  { name: "TLDR Founders", query: "from:dan@tldrnewsletter.com" },
];

function getTodayQuery() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `after:${yyyy}/${mm}/${dd}`;
}

function extractBody(message) {
  const parts = message.payload?.parts || [];
  for (const mimeType of ["text/plain", "text/html"]) {
    const part = parts.find((p) => p.mimeType === mimeType);
    if (part?.body?.data) {
      return Buffer.from(part.body.data, "base64url").toString("utf-8");
    }
    for (const p of parts) {
      if (p.parts) {
        const nested = p.parts.find((np) => np.mimeType === mimeType);
        if (nested?.body?.data) {
          return Buffer.from(nested.body.data, "base64url").toString("utf-8");
        }
      }
    }
  }
  if (message.payload?.body?.data) {
    return Buffer.from(message.payload.body.data, "base64url").toString("utf-8");
  }
  return null;
}

function storyId(source, headline, date) {
  const str = `${source}|${headline}|${date}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `news_${Math.abs(hash).toString(36)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
    SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return res.status(500).json({ error: "Google credentials not configured" });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase credentials not configured" });
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const today = new Date().toISOString().slice(0, 10);
    const dateQuery = getTodayQuery();
    const results = [];

    for (const { name, query } of SOURCES) {
      const q = `${query} ${dateQuery}`;
      const list = await gmail.users.messages.list({ userId: "me", q, maxResults: 1 });

      if (!list.data.messages?.length) {
        results.push({ source: name, found: false, stories: 0 });
        continue;
      }

      const msg = await gmail.users.messages.get({
        userId: "me", id: list.data.messages[0].id, format: "full",
      });

      const body = extractBody(msg.data);
      if (!body) {
        results.push({ source: name, found: true, stories: 0, error: "empty body" });
        continue;
      }

      const truncated = body.length > 30000 ? body.slice(0, 30000) : body;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Extract the top 3 most important stories from this "${name}" newsletter email.

For each story, provide:
- headline: a concise headline (under 100 chars)
- category: a 1-2 word tag like "Models", "Funding", "Agents", "Research", "Enterprise", "Open Source", "Startups", "Policy", "Tools"
- summary: exactly 1 sentence summarizing the story
- url: the URL/link associated with the story from the newsletter (the hyperlink on the headline or "read more" link). If no URL found, use null.

Return ONLY valid JSON — no markdown, no backticks, no explanation. Format:
[{"headline": "...", "category": "...", "summary": "...", "url": "..."}]

Newsletter content:
${truncated}`,
        }],
      });

      const text = response.content[0]?.text || "[]";
      const match = text.match(/\[[\s\S]*\]/);
      let stories = [];
      if (match) {
        try { stories = JSON.parse(match[0]).slice(0, 3); } catch {}
      }

      for (const s of stories) {
        results.push({ source: name, found: true, stories: stories.length });
        // Only push source summary once
        break;
      }
      if (!stories.length) {
        results.push({ source: name, found: true, stories: 0, error: "parse failed" });
        continue;
      }

      const rows = stories.map((s) => ({
        id: storyId(name, s.headline, today),
        source: name,
        headline: s.headline,
        category: s.category,
        summary: s.summary,
        url: s.url || null,
        story_date: today,
      }));

      const { error } = await supabase
        .from("tm_news_summaries")
        .upsert(rows, { onConflict: "source,headline,story_date" });

      if (error) {
        results.push({ source: name, found: true, stories: stories.length, error: error.message });
      }
    }

    res.json({ ok: true, date: today, results });
  } catch (err) {
    console.error("[news/capture] error:", err);
    res.status(500).json({ error: err.message });
  }
}
