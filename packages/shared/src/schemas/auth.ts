import { z } from "zod";

// bcrypt truncates at 72 bytes — disallow longer passwords up front.
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_MIN_LENGTH = 8;

export const registerSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  name: z.string().min(1).max(255),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
export type LoginInput = z.infer<typeof loginSchema>;
