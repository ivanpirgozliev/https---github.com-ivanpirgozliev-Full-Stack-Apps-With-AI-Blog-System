import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { verifyToken } from "@/server/lib/jwt";

const ADMIN_PATH_PREFIX = "/admin";
const API_PATH_PREFIX = "/api/";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.MOBILE_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Edge-layer responsibilities:
 *   1. Short-circuit CORS preflight (`OPTIONS /api/*`) so the browser is happy
 *      before our route handlers ever run.
 *   2. First-pass auth gate for `/dashboard/*` and `/admin/*` — redirect to
 *      `/auth/login` if no valid JWT cookie. Services re-check, this is just UX.
 *
 * Renamed from `middleware.ts` per Next.js 16's proxy convention.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---------- CORS preflight ----------
  if (req.method === "OPTIONS" && pathname.startsWith(API_PATH_PREFIX)) {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // ---------- API requests: just pass through (next.config.ts adds CORS) ----------
  if (pathname.startsWith(API_PATH_PREFIX)) {
    return NextResponse.next();
  }

  // ---------- Protected sections ----------
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(req);

  const payload = await verifyToken(token);
  if (!payload) return redirectToLogin(req);

  if (pathname.startsWith(ADMIN_PATH_PREFIX) && payload.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
