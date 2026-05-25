"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema } from "@blog/shared";
import { loginAction, type AuthActionState } from "@/app/auth/actions";

interface LoginFormProps {
  redirect?: string;
}

export function LoginForm({ redirect }: LoginFormProps) {
  const [serverState, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    if (redirect) fd.set("redirect", redirect);
    startTransition(() => formAction(fd));
  });

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted mt-1">Welcome back.</p>
      </div>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="input"
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="input"
        />
      </Field>

      {serverState?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {serverState.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-gradient">
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm text-muted text-center">
        Don&apos;t have an account?{" "}
        <a href={`/auth/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-accent hover:underline">
          Create one
        </a>
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
