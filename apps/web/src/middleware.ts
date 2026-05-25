import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { verifyToken } from "@/server/lib/jwt";

const ADMIN_PATH_PREFIX = "/admin";

/**
 * First-pass auth gate for protected sections.
 *
 * Re-verification still happens in services — middleware is best-effort UX
 * (redirect on the edge) and a single source of truth for protected routes,
 * but it is *not* the only line of defense.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(req);

  const payload = await verifyToken(token);
  if (!payload) return redirectToLogin(req);

  if (req.nextUrl.pathname.startsWith(ADMIN_PATH_PREFIX) && payload.role !== "admin") {
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
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
