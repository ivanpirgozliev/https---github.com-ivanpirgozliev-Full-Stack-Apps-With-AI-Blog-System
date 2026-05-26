import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { verifyToken } from "@/server/lib/jwt";

const ADMIN_PATH_PREFIX = "/admin";
const API_PATH_PREFIX = "/api/";

// Origins allowed to call our API from a different domain. Each must be an
// exact match (no wildcards) — the CORS spec is fussy about this.
const ALLOWED_ORIGINS = new Set(
  [
    process.env.MOBILE_ORIGIN, // e.g. https://blog-system-mobile-app.netlify.app
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3000",
  ].filter(Boolean) as string[],
);

/** Echo back the request Origin only when whitelisted. */
function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed = origin !== null && ALLOWED_ORIGINS.has(origin);
  return {
    // When not in the allow list we fall back to `*`; combined with no cookies
    // on cross-origin fetches (we use Bearer tokens for that), this is safe.
    "Access-Control-Allow-Origin": allowed ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Edge-layer responsibilities:
 *   1. Short-circuit CORS preflight (`OPTIONS /api/*`) with the right echo.
 *   2. Attach CORS headers to every `/api/*` response.
 *   3. First-pass auth gate for `/dashboard/*` and `/admin/*` — redirect to
 *      `/auth/login` if no valid JWT cookie. Services re-check, this is just UX.
 *
 * Renamed from `middleware.ts` per Next.js 16's proxy convention.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // ---------- CORS preflight ----------
  if (req.method === "OPTIONS" && pathname.startsWith(API_PATH_PREFIX)) {
    return new NextResponse(null, { status: 204, headers: corsHeadersFor(origin) });
  }

  // ---------- API requests: pass through, but attach CORS headers ----------
  if (pathname.startsWith(API_PATH_PREFIX)) {
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(corsHeadersFor(origin))) {
      res.headers.set(k, v);
    }
    return res;
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
