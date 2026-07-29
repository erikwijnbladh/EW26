/**
 * Asks the existing refresh token what it can do.
 *
 *   npm run spotify:check
 *
 * Reads the credentials already in .env.local (or the environment) and does
 * one refresh. Spotify restates the granted scopes on every refresh, so this
 * reports what the live token actually carries without minting a new one or
 * deploying anything — then calls both endpoints the widget needs so a scope
 * that is present but still failing has nowhere to hide.
 *
 * Read-only. It changes no credentials and stores nothing.
 */
import { readFileSync } from "node:fs";

const REQUIRED = ["user-read-currently-playing", "user-read-recently-played"];

// Fill anything missing from .env.local, so this works straight after a
// `vercel env pull` without also needing a --env-file flag.
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, raw] = match;
    if (!process.env[key]) process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
} catch {
  // No .env.local — the environment is expected to carry them instead.
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH = process.env.SPOTIFY_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH) {
  console.error(
    "Need SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN,\n" +
      "in .env.local or the environment. `vercel env pull .env.local` fetches\n" +
      "whatever production is actually using.",
  );
  process.exit(1);
}

const res = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
  },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: REFRESH,
  }),
});

if (!res.ok) {
  console.error(`Refresh failed: ${res.status} ${await res.text()}`);
  console.error("\nThe token itself is rejected — mint a new one.");
  process.exit(1);
}

const { access_token, scope = "" } = await res.json();
const granted = scope.split(" ").filter(Boolean);
const missing = REQUIRED.filter((s) => !granted.includes(s));

console.log(`\ngranted: ${granted.join(", ") || "(none reported)"}`);

if (missing.length) {
  console.log(`missing: ${missing.join(", ")}`);
  console.log(
    "\nThat's the problem. Scopes are fixed when the token is minted, so no\n" +
      "amount of asking later widens this one. Re-run `npm run spotify:token`\n" +
      "and replace SPOTIFY_REFRESH_TOKEN wherever it's set, including Vercel.",
  );
} else {
  console.log("missing: none — the token covers everything the widget needs.");
}

// Scopes can look right and the call still fail, so check the endpoints too.
const probe = async (label, path) => {
  const r = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { authorization: `Bearer ${access_token}` },
  });

  if (r.status === 204) {
    console.log(`${label}: 204 (nothing playing)`);
    return;
  }

  if (!r.ok) {
    console.log(`${label}: ${r.status} ${(await r.text()).slice(0, 160)}`);
    return;
  }

  const body = await r.json();
  const count = body.items?.length;

  console.log(
    `${label}: 200` + (count === undefined ? "" : ` — ${count} items`),
  );
};

console.log("");
await probe("currently-playing", "/me/player/currently-playing");
await probe("recently-played", "/me/player/recently-played?limit=50");
console.log("");
