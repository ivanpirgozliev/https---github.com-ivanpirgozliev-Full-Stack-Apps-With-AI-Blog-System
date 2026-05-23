import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Neon's serverless driver speaks WebSocket. Node.js has no native WebSocket,
// so we plug in the `ws` polyfill. Edge runtimes already provide WebSocket.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse one Pool across hot reloads in dev so we don't exhaust connections.
declare global {
  var __dbPool: Pool | undefined;
}

const pool = globalThis.__dbPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") {
  globalThis.__dbPool = pool;
}

export const db = drizzle(pool, { schema });
export type DB = typeof db;
