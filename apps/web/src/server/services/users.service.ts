import "server-only";
import { count, eq } from "drizzle-orm";
import type { PublicUser, UserRole } from "@blog/shared";
import { db } from "../db/client";
import { users, type User } from "../db/schema";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Internal-only: includes `passwordHash`. Never return from a route handler. */
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return user ?? null;
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ? toPublicUser(user) : null;
}

export async function updateUserAvatar(id: string, avatarUrl: string | null): Promise<PublicUser | null> {
  const [user] = await db
    .update(users)
    .set({ avatarUrl })
    .where(eq(users.id, id))
    .returning();
  return user ? toPublicUser(user) : null;
}

export async function updateUserRole(id: string, role: UserRole): Promise<PublicUser | null> {
  const [user] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning();
  return user ? toPublicUser(user) : null;
}

export interface ListUsersResult {
  users: PublicUser[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listUsers(input: {
  page?: number;
  pageSize?: number;
}): Promise<ListUsersResult> {
  const pageSize = clampPageSize(input.pageSize);
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const offset = (page - 1) * pageSize;

  const [rows, totals] = await Promise.all([
    db.select().from(users).orderBy(users.createdAt).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(users),
  ]);

  return {
    users: rows.map(toPublicUser),
    total: totals[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

function clampPageSize(input: number | undefined): number {
  const n = Math.floor(input ?? DEFAULT_PAGE_SIZE);
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export { normalizeEmail };
