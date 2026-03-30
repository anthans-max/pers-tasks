/**
 * One-time script to obtain a Google OAuth2 refresh token.
 *
 * Usage:
 *   1. Create OAuth2 credentials in Google Cloud Console:
 *      - Go to https://console.cloud.google.com/apis/credentials
 *      - Create an OAuth 2.0 Client ID (Desktop application type)
 *      - Copy the Client ID and Client Secret
 *
 *   2. Enable the Google Calendar API:
 *      - Go to https://console.cloud.google.com/apis/library
 *      - Search "Google Calendar API" and enable it
 *
 *   3. Run this script:
 *      node scripts/get-google-token.js
 *
 *   4. Visit the URL printed, grant access, paste the auth code when prompted.
 *      The script prints your refresh token — copy it to .env.local.
 */

import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment first:\n" +
    "  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-google-token.js"
  );
  process.exit(1);
}

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob"; // out-of-band — no local server needed

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // forces refresh_token to be returned even if previously granted
});

console.log("\n─────────────────────────────────────────────────────────");
console.log("Open this URL in your browser and grant access:");
console.log("\n" + authUrl + "\n");
console.log("─────────────────────────────────────────────────────────\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Paste the authorization code here: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2.getToken(code.trim());
    console.log("\n✅ Success! Add this to your .env.local:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\n(Also make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in .env.local)\n");
  } catch (err) {
    console.error("Failed to exchange code for tokens:", err.message);
    process.exit(1);
  }
});
