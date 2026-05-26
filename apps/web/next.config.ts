import type { NextConfig } from "next";

// CORS headers are set dynamically per request in src/proxy.ts so we can
// echo back exactly one origin (the CORS spec forbids comma-separated lists).
const nextConfig: NextConfig = {
  transpilePackages: ["@blog/shared"],
};

export default nextConfig;
