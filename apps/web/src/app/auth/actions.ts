"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "@blog/shared";
import { loginUser, registerUser } from "@/server/services/auth.service";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from "@/lib/auth-constants";

export type AuthActionState = { error: string } | undefined;

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await loginUser(parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  await setAuthCookie(result.data.token);
  redirect(redirectTargetFrom(formData));
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  await setAuthCookie(result.data.token);
  redirect(redirectTargetFrom(formData));
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/");
}

async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

function redirectTargetFrom(formData: FormData): string {
  const raw = formData.get("redirect");
  if (typeof raw !== "string") return "/dashboard";
  // Only accept same-origin relative paths to prevent open-redirect.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
