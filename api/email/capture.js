import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const USER_ID = "anthan";

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

    // Search for unread emails from today
    const list = await gmail.users.messages.list({
      userId: "me", q: "is:unread newer_than:1d", maxResults: 50,
    });

    const messages = list.data.messages || [];
    const today = new Date().toISOString().slice(0, 10);
    const actionable = [];

    // Read each email and classify
    for (const { id } of messages) {
      try {
        const msg = await gmail.users.messages.get({ userId: "me", id, format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = msg.data.payload?.headers || [];
        const subject = headers.find(h => h.name === "Subject")?.value || "";
        const from = headers.find(h => h.name === "From")?.value || "";
        const date = headers.find(h => h.name === "Date")?.value || "";

        // Quick skip: newsletters, job alerts, marketing
        const skipPatterns = /newsletter|unsubscribe|jobot|mjh|noreply|marketing|promotions/i;
        if (skipPatterns.test(from) || skipPatterns.test(subject)) continue;

        actionable.push({ messageId: id, subject, from, date });
      } catch { continue; }
    }

    if (actionable.length === 0) {
      return res.json({ ok: true, date: today, checked: messages.length, inserted: 0, tasks: [] });
    }

    // Batch classify with Claude
    const emailSummary = actionable.map((e, i) =>
      `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}`
    ).join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Review these emails and identify which ones contain ACTIONABLE TASKS — something requiring a specific action: a deadline, required response, bill/payment, event reminder, urgent alert, or follow-up.

SKIP: newsletters, recurring job alert spam, generic marketing/promotions, bank security tips with no action needed, automated order confirmations with no action, and general FYI updates.

For each actionable email, provide:
- index: the email number from the list
- title: clear description of what needs to be done
- priority: 1=critical/due today, 2=important/deadline soon, 3=normal, 4=low, 5=informational
- due_date: YYYY-MM-DD if explicitly mentioned, otherwise null

Return ONLY valid JSON — no markdown, no backticks. Format:
[{"index": 1, "title": "...", "priority": 3, "due_date": null}]

If NO emails are actionable, return: []

Emails:
${emailSummary}`,
      }],
    });

    const text = response.content[0]?.text || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    let classified = [];
    if (match) {
      try { classified = JSON.parse(match[0]); } catch {}
    }

    if (classified.length === 0) {
      return res.json({ ok: true, date: today, checked: messages.length, inserted: 0, tasks: [] });
    }

    // Check for existing IDs
    const newTasks = classified.map(c => {
      const email = actionable[c.index - 1];
      if (!email) return null;
      const emailDate = email.date ? new Date(email.date).toISOString().slice(0, 10) : today;
      return {
        id: `email-${email.messageId}`,
        user_id: USER_ID,
        title: c.title,
        email_from: email.from.replace(/<.*>/, "").trim(),
        email_date: emailDate,
        priority: c.priority,
        due_date: c.due_date || null,
        captured_at: today,
      };
    }).filter(Boolean);

    const ids = newTasks.map(t => t.id);
    const { data: existing } = await supabase
      .from("tm_email_tasks")
      .select("id")
      .in("id", ids);

    const existingIds = new Set((existing || []).map(r => r.id));
    const toInsert = newTasks.filter(t => !existingIds.has(t.id));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("tm_email_tasks").insert(toInsert);
      if (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    res.json({
      ok: true, date: today,
      checked: messages.length,
      inserted: toInsert.length,
      tasks: toInsert.map(t => t.title),
    });
  } catch (err) {
    console.error("[email/capture] error:", err);
    res.status(500).json({ error: err.message });
  }
}
