import { z } from "zod";

export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * The user shape we send to clients.
 * Never includes `passwordHash` — that's internal-only.
 */
export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
  role: userRoleSchema,
  avatarUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
