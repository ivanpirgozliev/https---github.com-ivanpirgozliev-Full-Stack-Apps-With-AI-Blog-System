import "server-only";
import { count, desc, eq } from "drizzle-orm";
import type { Paginated, PublicCommentWithAuthor, UserRole } from "@blog/shared";
import { db } from "../db/client";
import { comments, posts, type Comment } from "../db/schema";
import { err, ok, type ServiceResult } from "../lib/result";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export interface ListCommentsInput {
  postId: number;
  page?: number;
  pageSize?: number;
}

export async function listCommentsForPost(
  input: ListCommentsInput,
): Promise<Paginated<PublicCommentWithAuthor>> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;

  const [rows, totals] = await Promise.all([
    db.query.comments.findMany({
      where: eq(comments.postId, input.postId),
      with: {
        author: { columns: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [desc(comments.createdAt)],
      limit: pageSize,
      offset,
    }),
    db.select({ value: count() }).from(comments).where(eq(comments.postId, input.postId)),
  ]);

  return {
    items: rows.map(toPublicCommentWithAuthor),
    total: totals[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export interface AddCommentInput {
  postId: number;
  authorId: string;
  content: string;
  parentId?: number | null;
}

export async function addComment(
  input: AddCommentInput,
): Promise<ServiceResult<PublicCommentWithAuthor>> {
  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, input.postId)).limit(1);
  if (!post) return err("NOT_FOUND", "Post not found.");

  if (input.parentId != null) {
    const [parent] = await db
      .select({ postId: comments.postId })
      .from(comments)
      .where(eq(comments.id, input.parentId))
      .limit(1);
    if (!parent) return err("NOT_FOUND", "Parent comment not found.");
    if (parent.postId !== input.postId) {
      return err("INVALID_PARENT", "Parent comment belongs to a different post.");
    }
  }

  const [created] = await db
    .insert(comments)
    .values({
      postId: input.postId,
      authorId: input.authorId,
      content: input.content.trim(),
      parentId: input.parentId ?? null,
    })
    .returning();
  if (!created) return err("INSERT_FAILED", "Failed to add comment.");

  // Re-query to get the joined author. addComment is rare relative to read traffic.
  const enriched = await db.query.comments.findFirst({
    where: eq(comments.id, created.id),
    with: { author: { columns: { id: true, name: true, avatarUrl: true } } },
  });
  if (!enriched) return err("INSERT_FAILED", "Comment was created but could not be read back.");
  return ok(toPublicCommentWithAuthor(enriched));
}

export interface DeleteCommentInput {
  id: number;
  actorId: string;
  actorRole: UserRole;
}

export async function deleteComment(
  input: DeleteCommentInput,
): Promise<ServiceResult<{ id: number }>> {
  const [existing] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, input.id))
    .limit(1);
  if (!existing) return err("NOT_FOUND", "Comment not found.");
  if (existing.authorId !== input.actorId && input.actorRole !== "admin") {
    return err("FORBIDDEN", "You don't have permission to delete this comment.");
  }
  // Replies have parent_id -> set null on cascade (see schema), so the thread is preserved.
  await db.delete(comments).where(eq(comments.id, input.id));
  return ok({ id: input.id });
}

type CommentRowWithAuthor = Comment & {
  author: { id: string; name: string; avatarUrl: string | null };
};

function toPublicCommentWithAuthor(row: CommentRowWithAuthor): PublicCommentWithAuthor {
  return {
    id: row.id,
    postId: row.postId,
    authorId: row.authorId,
    content: row.content,
    parentId: row.parentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: row.author,
  };
}

function clampPageSize(input: number | undefined): number {
  const n = Math.floor(input ?? DEFAULT_PAGE_SIZE);
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE);
}
