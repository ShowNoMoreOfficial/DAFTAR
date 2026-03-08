import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TODO: Remove once all TS errors are fixed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
