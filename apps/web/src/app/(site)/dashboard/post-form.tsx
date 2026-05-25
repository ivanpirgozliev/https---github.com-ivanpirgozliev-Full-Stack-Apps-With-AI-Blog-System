"use client";

import { startTransition, useActionState } from "react";
import dynamic from "next/dynamic";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePicker } from "@/components/image-picker";
import "@uiw/react-md-editor/markdown-editor.css";

// Heavy markdown editor — only loaded on the client.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// Form-local schema: more lenient than the server schema (empty strings allowed
// for optional fields). The Server Action re-validates with the strict
// shared schema before hitting the DB.
const postFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(500),
  coverImageUrl: z.string().max(2048),
  categoryId: z.string(),
  status: z.enum(["draft", "published"]),
});
export type PostFormValues = z.infer<typeof postFormSchema>;

export type PostFormState = { error: string } | undefined;

export interface PostFormProps {
  categories: Array<{ id: number; name: string }>;
  initial?: Partial<PostFormValues>;
  serverAction: (
    prev: PostFormState,
    fd: FormData,
  ) => Promise<PostFormState>;
  submitLabel: string;
}

export function PostForm({ categories, initial, serverAction, submitLabel }: PostFormProps) {
  const [serverState, formAction, pending] = useActionState<PostFormState, FormData>(
    serverAction,
    undefined,
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      coverImageUrl: "",
      categoryId: "",
      status: "draft",
      ...initial,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("content", values.content);
    if (values.excerpt) fd.set("excerpt", values.excerpt);
    if (values.coverImageUrl) fd.set("coverImageUrl", values.coverImageUrl);
    if (values.categoryId) fd.set("categoryId", values.categoryId);
    fd.set("status", values.status);
    startTransition(() => formAction(fd));
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <input id="title" {...register("title")} className="input" />
      </Field>

      <Field
        label="Excerpt"
        htmlFor="excerpt"
        error={errors.excerpt?.message}
        hint="Optional. Up to 500 characters."
      >
        <textarea id="excerpt" {...register("excerpt")} className="textarea" rows={3} />
      </Field>

      <Field label="Content" htmlFor="content" error={errors.content?.message}>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <div data-color-mode="light">
              <MDEditor
                value={field.value}
                onChange={(v) => field.onChange(v ?? "")}
                height={400}
                preview="edit"
              />
            </div>
          )}
        />
      </Field>

      <Field
        label="Cover image"
        htmlFor="coverImageUrl"
        error={errors.coverImageUrl?.message}
      >
        <Controller
          name="coverImageUrl"
          control={control}
          render={({ field }) => (
            <ImagePicker value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>

      <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
        <select id="categoryId" {...register("categoryId")} className="select">
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <select id="status" {...register("status")} className="select">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </Field>

      {serverState?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {serverState.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-gradient">
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
