"use server";

import { revalidatePath } from "next/cache";
import { addCommentSchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { addComment, deleteComment } from "@/server/services/comments.service";
import { getPostBySlug } from "@/server/services/posts.service";

export type CommentActionState = { error: string } | undefined;

export async function addCommentAction(
  slug: string,
  _prev: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required." };

  const post = await getPostBySlug(slug);
  if (!post) return { error: "Post not found." };

  const parsed = addCommentSchema.safeParse({
    content: formData.get("content"),
    parentId: emptyToNumber(formData.get("parentId")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await addComment({
    postId: post.id,
    authorId: user.id,
    ...parsed.data,
  });
  if (!result.ok) return { error: result.error.message };

  revalidatePath(`/posts/${slug}`);
  return undefined;
}

export async function deleteCommentAction(commentId: number, postSlug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required.");

  const result = await deleteComment({
    id: commentId,
    actorId: user.id,
    actorRole: user.role,
  });
  if (!result.ok) throw new Error(result.error.message);

  revalidatePath(`/posts/${postSlug}`);
}

function emptyToNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
