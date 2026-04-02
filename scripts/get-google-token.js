/**
 * One-time script to obtain a Google OAuth2 refresh token.
 *
 * Usage:
 *   1. In Google Cloud Console (https://console.cloud.google.com/apis/credentials),
 *      open your OAuth 2.0 Client and add this redirect URI:
 *        http://localhost:3333/callback
 *
 *   2. Enable the Google Calendar API and Gmail API:
 *      https://console.cloud.google.com/apis/library
 *
 *   3. Run this script:
 *      GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-google-token.js
 *
 *   4. A browser window opens — grant access. The token prints in the terminal.
 */

import { google } from "googleapis";
import http from "http";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment first:\n" +
    "  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-google-token.js"
  );
  process.exit(1);
}

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2>Authorization denied: ${error}</h2><p>You can close this tab.</p>`);
    console.error(`\n❌ Authorization denied: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h2>No authorization code received</h2>");
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Success! You can close this tab.</h2><p>Check your terminal for the refresh token.</p>");

    console.log("\n✅ Success! Update your environment with:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\nUpdate this in Vercel env vars and .env.local\n");
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h2>Token exchange failed: ${err.message}</h2>`);
    console.error("Failed to exchange code for tokens:", err.message);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log("\n─────────────────────────────────────────────────────────");
  console.log("Opening browser for Google authorization...");
  console.log("\nIf it doesn't open automatically, visit:");
  console.log(`\n${authUrl}\n`);
  console.log("─────────────────────────────────────────────────────────\n");

  // Open browser automatically on macOS
  import("child_process").then(({ exec }) => {
    exec(`open "${authUrl}"`);
  });
});
