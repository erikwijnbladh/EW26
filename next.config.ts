import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
