"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterInput, registerSchema } from "@blog/shared";
import { registerAction, type AuthActionState } from "@/app/auth/actions";

interface RegisterFormProps {
  redirect?: string;
}

export function RegisterForm({ redirect }: RegisterFormProps) {
  const [serverState, formAction, pending] = useActionState<AuthActionState, FormData>(
    registerAction,
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("name", values.name);
    if (redirect) fd.set("redirect", redirect);
    startTransition(() => formAction(fd));
  });

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="text-sm text-muted mt-1">It&apos;s free and takes a minute.</p>
      </div>

      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <input id="name" autoComplete="name" {...register("name")} className="input" />
      </Field>

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
          autoComplete="new-password"
          {...register("password")}
          className="input"
        />
        <p className="text-xs text-muted">At least 8 characters.</p>
      </Field>

      {serverState?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {serverState.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-gradient">
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-muted text-center">
        Already have an account?{" "}
        <a href={`/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-accent hover:underline">
          Sign in
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
