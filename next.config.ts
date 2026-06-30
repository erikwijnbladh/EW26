import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow a higher-quality variant for the profile photo.
    qualities: [75, 90],
  },
};

export default nextConfig;
