import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow a higher-quality variant for the profile photo.
    qualities: [75, 90],
    // Spotify serves album art off its image CDN.
    remotePatterns: [{ protocol: "https", hostname: "i.scdn.co" }],
  },
};

export default nextConfig;
