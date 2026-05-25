import "server-only";
import bcrypt from "bcryptjs";
import type { PublicUser } from "@blog/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { signToken } from "../lib/jwt";
import { getUserByEmail, normalizeEmail, toPublicUser } from "./users.service";

export { verifyToken } from "../lib/jwt";

const BCRYPT_ROUNDS = 10;

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface AuthSuccess {
  user: PublicUser;
  token: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<ServiceResult<AuthSuccess>> {
  const email = normalizeEmail(input.email);

  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      ok: false,
      error: { code: "EMAIL_TAKEN", message: "An account with this email already exists." },
    };
  }

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: input.name.trim(),
      passwordHash,
      role: "user",
    })
    .returning();

  if (!created) {
    return {
      ok: false,
      error: { code: "INSERT_FAILED", message: "Failed to create the user." },
    };
  }

  const token = await signToken({ sub: created.id, role: created.role });
  return { ok: true, data: { user: toPublicUser(created), token } };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<ServiceResult<AuthSuccess>> {
  const user = await getUserByEmail(input.email);
  // Constant-ish-time: compare a dummy hash even when the user doesn't exist
  // so login latency doesn't leak which emails are registered.
  const targetHash = user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid";
  const passwordOk = await comparePassword(input.password, targetHash);

  if (!user || !passwordOk) {
    return {
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
    };
  }

  const token = await signToken({ sub: user.id, role: user.role });
  return { ok: true, data: { user: toPublicUser(user), token } };
}
