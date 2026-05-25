"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPostSchema, updatePostSchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import {
  createPost,
  deletePost,
  getPostBySlug,
  updatePost,
} from "@/server/services/posts.service";

export type PostActionState = { error: string } | undefined;

export async function createPostAction(
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required." };

  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: emptyToNull(formData.get("excerpt")),
    coverImageUrl: emptyToNull(formData.get("coverImageUrl")),
    categoryId: emptyToNumber(formData.get("categoryId")),
    status: formData.get("status") ?? "draft",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createPost({ authorId: user.id, ...parsed.data });
  if (!result.ok) return { error: result.error.message };

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/dashboard/posts/${result.data.id}/edit`);
}

export async function updatePostAction(
  slug: string,
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required." };

  const existing = await getPostBySlug(slug);
  if (!existing) return { error: "Post not found." };

  const parsed = updatePostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: emptyToNull(formData.get("excerpt")),
    coverImageUrl: emptyToNull(formData.get("coverImageUrl")),
    categoryId: emptyToNumber(formData.get("categoryId")),
    status: formData.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updatePost({
    id: existing.id,
    actorId: user.id,
    actorRole: user.role,
    changes: parsed.data,
  });
  if (!result.ok) return { error: result.error.message };

  revalidatePath("/");
  revalidatePath(`/posts/${result.data.slug}`);
  revalidatePath("/dashboard");
  return undefined;
}

export async function deletePostAction(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  const existing = await getPostBySlug(slug);
  if (!existing) return;

  const result = await deletePost({
    id: existing.id,
    actorId: user.id,
    actorRole: user.role,
  });
  if (!result.ok) throw new Error(result.error.message);

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function emptyToNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
