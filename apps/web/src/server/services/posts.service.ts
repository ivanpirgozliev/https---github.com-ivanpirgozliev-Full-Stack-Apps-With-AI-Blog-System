import "server-only";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  Paginated,
  PostStatus,
  PublicPost,
  PublicPostWithRefs,
  UserRole,
} from "@blog/shared";
import { db } from "../db/client";
import { categories, posts, type Post } from "../db/schema";
import { err, ok, type ServiceResult } from "../lib/result";
import { slugifyWithSuffix } from "../lib/slug";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SLUG_ATTEMPTS = 5;

export interface ListPostsInput {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  search?: string;
  status?: PostStatus;
  authorId?: string;
}

export async function listPosts(input: ListPostsInput): Promise<Paginated<PublicPostWithRefs>> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;

  let categoryIdFilter: number | undefined;
  if (input.categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, input.categorySlug))
      .limit(1);
    if (!cat) {
      return { items: [], total: 0, page, pageSize };
    }
    categoryIdFilter = cat.id;
  }

  const conditions = [];
  if (input.status) conditions.push(eq(posts.status, input.status));
  if (input.authorId) conditions.push(eq(posts.authorId, input.authorId));
  if (categoryIdFilter !== undefined) conditions.push(eq(posts.categoryId, categoryIdFilter));
  if (input.search) {
    const pattern = `%${input.search}%`;
    conditions.push(or(ilike(posts.title, pattern), ilike(posts.excerpt, pattern)));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db.query.posts.findMany({
      where,
      with: {
        author: { columns: { id: true, name: true, avatarUrl: true } },
        category: { columns: { id: true, name: true, slug: true } },
      },
      // Published posts ordered by publishedAt; drafts (null publishedAt) fall back to createdAt.
      orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
      limit: pageSize,
      offset,
    }),
    db.select({ value: count() }).from(posts).where(where),
  ]);

  return {
    items: rows.map(toPublicPostWithRefs),
    total: totals[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export async function getPostBySlug(slug: string): Promise<PublicPostWithRefs | null> {
  const row = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: { columns: { id: true, name: true, avatarUrl: true } },
      category: { columns: { id: true, name: true, slug: true } },
    },
  });
  return row ? toPublicPostWithRefs(row) : null;
}

export interface CreatePostInput {
  authorId: string;
  title: string;
  content: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  categoryId?: number | null;
  status?: PostStatus;
}

export async function createPost(input: CreatePostInput): Promise<ServiceResult<PublicPost>> {
  if (input.categoryId != null) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);
    if (!cat) return err("INVALID_CATEGORY", "The selected category does not exist.");
  }

  let slug: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = slugifyWithSuffix(input.title);
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);
    if (!existing) {
      slug = candidate;
      break;
    }
  }
  if (!slug) return err("SLUG_CONFLICT", "Could not generate a unique slug. Try a different title.");

  const status: PostStatus = input.status ?? "draft";
  const [created] = await db
    .insert(posts)
    .values({
      authorId: input.authorId,
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      coverImageUrl: input.coverImageUrl ?? null,
      status,
      categoryId: input.categoryId ?? null,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  if (!created) return err("INSERT_FAILED", "Failed to create post.");
  return ok(toPublicPost(created));
}

export interface UpdatePostInput {
  id: number;
  actorId: string;
  actorRole: UserRole;
  changes: {
    title?: string;
    content?: string;
    excerpt?: string | null;
    coverImageUrl?: string | null;
    categoryId?: number | null;
    status?: PostStatus;
  };
}

export async function updatePost(input: UpdatePostInput): Promise<ServiceResult<PublicPost>> {
  const [existing] = await db.select().from(posts).where(eq(posts.id, input.id)).limit(1);
  if (!existing) return err("NOT_FOUND", "Post not found.");
  if (existing.authorId !== input.actorId && input.actorRole !== "admin") {
    return err("FORBIDDEN", "You don't have permission to edit this post.");
  }

  if (input.changes.categoryId != null) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.changes.categoryId))
      .limit(1);
    if (!cat) return err("INVALID_CATEGORY", "The selected category does not exist.");
  }

  const update: Partial<typeof posts.$inferInsert> = {};
  if (input.changes.title !== undefined) update.title = input.changes.title.trim();
  if (input.changes.content !== undefined) update.content = input.changes.content;
  if (input.changes.excerpt !== undefined) update.excerpt = input.changes.excerpt;
  if (input.changes.coverImageUrl !== undefined) update.coverImageUrl = input.changes.coverImageUrl;
  if (input.changes.categoryId !== undefined) update.categoryId = input.changes.categoryId;
  if (input.changes.status !== undefined) {
    update.status = input.changes.status;
    // First-time publish: stamp publishedAt now.
    if (
      input.changes.status === "published" &&
      existing.status !== "published" &&
      !existing.publishedAt
    ) {
      update.publishedAt = new Date();
    }
  }

  if (Object.keys(update).length === 0) {
    return ok(toPublicPost(existing));
  }

  const [updated] = await db
    .update(posts)
    .set(update)
    .where(eq(posts.id, input.id))
    .returning();

  if (!updated) return err("UPDATE_FAILED", "Failed to update post.");
  return ok(toPublicPost(updated));
}

export interface DeletePostInput {
  id: number;
  actorId: string;
  actorRole: UserRole;
}

export async function deletePost(input: DeletePostInput): Promise<ServiceResult<{ id: number }>> {
  const [existing] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, input.id))
    .limit(1);
  if (!existing) return err("NOT_FOUND", "Post not found.");
  if (existing.authorId !== input.actorId && input.actorRole !== "admin") {
    return err("FORBIDDEN", "You don't have permission to delete this post.");
  }
  await db.delete(posts).where(eq(posts.id, input.id));
  return ok({ id: input.id });
}

/**
 * Raw SQL `+ 1` so it's a single atomic update and doesn't bump `updated_at`
 * via Drizzle's $onUpdate trigger (view count is metadata, not a content edit).
 */
export async function incrementViews(postId: number): Promise<void> {
  await db.execute(sql`UPDATE posts SET view_count = view_count + 1 WHERE id = ${postId}`);
}

function toPublicPost(post: Post): PublicPost {
  return {
    id: post.id,
    authorId: post.authorId,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl,
    status: post.status,
    categoryId: post.categoryId,
    viewCount: post.viewCount,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

type PostRowWithRefs = Post & {
  author: { id: string; name: string; avatarUrl: string | null };
  category: { id: number; name: string; slug: string } | null;
};

function toPublicPostWithRefs(row: PostRowWithRefs): PublicPostWithRefs {
  return {
    ...toPublicPost(row),
    author: row.author,
    category: row.category,
  };
}

function clampPageSize(input: number | undefined): number {
  const n = Math.floor(input ?? DEFAULT_PAGE_SIZE);
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE);
}

export { toPublicPost, toPublicPostWithRefs };
