import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include /skills/ directory in serverless function bundles (Vercel)
  // so SkillOrchestrator can read .md files from filesystem at runtime
  outputFileTracingIncludes: {
    "/api/**": ["./skills/**/*"],
  },
};

export default nextConfig;
