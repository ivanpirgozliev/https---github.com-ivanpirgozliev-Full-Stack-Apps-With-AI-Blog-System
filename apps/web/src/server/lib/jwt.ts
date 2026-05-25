import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@blog/shared";

const JWT_ALGORITHM = "HS256";
const JWT_EXPIRY = "7d";

let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is not set or is shorter than 32 chars.");
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALGORITHM],
    });
    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
