/**
 * One-off: turns a Spotify app's client ID/secret into a refresh token.
 *
 *   1. Create an app at https://developer.spotify.com/dashboard
 *   2. Add exactly this redirect URI:  http://127.0.0.1:8888/callback
 *   3. SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... npm run spotify:token
 *   4. Open the printed URL, approve, and copy SPOTIFY_REFRESH_TOKEN out
 *
 * The refresh token doesn't expire unless access is revoked, so this is run
 * once and the result goes in .env.local (and in the host's env for deploys).
 */
import { createServer } from "node:http";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT = "http://127.0.0.1:8888/callback";
const SCOPES = "user-read-currently-playing user-read-recently-played";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET before running this.",
  );
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT,
    state,
    // Force the consent screen even when the account has approved this app
    // before. Scopes are fixed at authorisation, so a token minted under a
    // narrower set stays narrow forever — silently re-approving is exactly
    // how you end up re-issuing the same insufficient grant.
    show_dialog: "true",
  });

async function exchange(code) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
    }),
  });

  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error || url.searchParams.get("state") !== state) {
    res.writeHead(400, { "content-type": "text/plain" });
    res.end(error ?? "State mismatch — start again.");
    server.close();
    process.exit(1);
  }

  try {
    const token = await exchange(code);
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("Done — back to the terminal.");
    console.log(`\nSPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`);

    // Spotify reports what it actually granted, which is not necessarily what
    // was asked for. Worth printing: a token missing user-read-recently-played
    // still fetches the current track happily, so the widget half-works and
    // the missing scope looks like an empty listening history instead.
    const granted = (token.scope ?? "").split(" ").filter(Boolean);
    const missing = SCOPES.split(" ").filter((s) => !granted.includes(s));

    console.log(`granted: ${granted.join(", ") || "(none)"}`);
    if (missing.length) {
      console.error(`MISSING: ${missing.join(", ")} — the widget needs these.`);
    }
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(String(e));
    console.error(e);
  }

  server.close();
});

server.listen(8888, "127.0.0.1", () => {
  console.log(`\nOpen this, approve, then come back:\n\n${authUrl}\n`);
});
