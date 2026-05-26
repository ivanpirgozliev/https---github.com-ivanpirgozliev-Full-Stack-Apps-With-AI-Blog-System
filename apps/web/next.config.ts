import type { NextConfig } from "next";

// Origins allowed to call /api/v1/*. Set MOBILE_ORIGIN in Netlify env vars
// to the public URL of the deployed Expo web build. In dev we also allow
// Metro's web origin (port 8081) and localhost variants.
const allowedOrigins = [
  process.env.MOBILE_ORIGIN,
  "http://localhost:8081",
  "http://localhost:19006",
].filter(Boolean) as string[];

const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "*";

const nextConfig: NextConfig = {
  transpilePackages: ["@blog/shared"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: corsOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
