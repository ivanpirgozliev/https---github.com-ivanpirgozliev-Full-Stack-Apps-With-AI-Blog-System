import "server-only";
import bcrypt from "bcryptjs";
import type { PublicUser } from "@blog/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { signToken } from "../lib/jwt";
import { err, ok, type ServiceResult } from "../lib/result";
import { getUserByEmail, normalizeEmail, toPublicUser } from "./users.service";

export { verifyToken } from "../lib/jwt";

const BCRYPT_ROUNDS = 10;

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
    return err("EMAIL_TAKEN", "An account with this email already exists.");
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
    return err("INSERT_FAILED", "Failed to create the user.");
  }

  const token = await signToken({ sub: created.id, role: created.role });
  return ok({ user: toPublicUser(created), token });
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
    return err("INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const token = await signToken({ sub: user.id, role: user.role });
  return ok({ user: toPublicUser(user), token });
}
