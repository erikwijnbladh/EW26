import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial prerendering, which is what lets `/` ship as static HTML with a
  // request-time hole for the track strip. Formerly `experimental.ppr`, folded
  // into this flag in Next 16.
  //
  // It also flips the default the other way round for data: nothing is cached
  // unless it says so, and anything uncached has to sit behind a Suspense
  // boundary. That's why `getContributions` carries an explicit `use cache`.
  cacheComponents: true,
  images: {
    // Allow a higher-quality variant for the profile photo.
    qualities: [75, 90],
    // Spotify serves album art off several CDN hosts, not just i.scdn.co.
    // Deliberately wider than the allowlist in lib/spotify.ts, so the two can
    // only ever drift in the safe direction — a host that passes there is
    // always configured here, and next/image never gets one it would throw on.
    remotePatterns: [
      { protocol: "https", hostname: "**.scdn.co" },
      { protocol: "https", hostname: "**.spotifycdn.com" },
    ],
  },
};

export default nextConfig;
