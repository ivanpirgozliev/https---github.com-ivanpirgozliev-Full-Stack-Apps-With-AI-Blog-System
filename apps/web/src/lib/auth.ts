import "server-only";
import { cookies, headers } from "next/headers";
import type { PublicUser } from "@blog/shared";
import { verifyToken } from "@/server/lib/jwt";
import { getUserById } from "@/server/services/users.service";
import { AUTH_COOKIE_NAME } from "./auth-constants";

/**
 * Resolve the authenticated user for the current request.
 *
 * Reads the JWT from the HttpOnly cookie (web) first, then falls back to
 * the `Authorization: Bearer …` header (mobile / external API consumers).
 * Returns `null` if there is no valid token or the user no longer exists.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await readToken();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return await getUserById(payload.sub);
}

async function readToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (fromCookie) return fromCookie;

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim() || null;
  }
  return null;
}
