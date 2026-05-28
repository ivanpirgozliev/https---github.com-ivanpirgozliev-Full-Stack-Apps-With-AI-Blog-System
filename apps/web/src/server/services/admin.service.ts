import "server-only";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { comments, posts, users } from "../db/schema";

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalPosts: number;
  totalPublishedPosts: number;
  totalDraftPosts: number;
  totalComments: number;
  totalViews: number;
}

export async function getStats(): Promise<AdminStats> {
  const [userStats, postStats, commentStats] = await Promise.all([
    db
      .select({
        total: count(),
        admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
      })
      .from(users),
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${posts.status} = 'published')::int`,
        drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
        totalViews: sql<number>`coalesce(sum(${posts.viewCount}), 0)::int`,
      })
      .from(posts),
    db.select({ total: count() }).from(comments),
  ]);

  return {
    totalUsers: userStats[0]?.total ?? 0,
    totalAdmins: userStats[0]?.admins ?? 0,
    totalPosts: postStats[0]?.total ?? 0,
    totalPublishedPosts: postStats[0]?.published ?? 0,
    totalDraftPosts: postStats[0]?.drafts ?? 0,
    totalComments: commentStats[0]?.total ?? 0,
    totalViews: postStats[0]?.totalViews ?? 0,
  };
}

export interface RecentPost {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: Date | string;
  author: { id: string; name: string; avatarUrl: string | null };
}

export async function getRecentPosts(limit = 5): Promise<RecentPost[]> {
  const rows = await db.query.posts.findMany({
    with: { author: { columns: { id: true, name: true, avatarUrl: true } } },
    orderBy: [desc(posts.createdAt)],
    limit,
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    createdAt: p.createdAt,
    author: p.author,
  }));
}

export interface RecentComment {
  id: number;
  content: string;
  createdAt: Date | string;
  post: { id: number; title: string; slug: string };
  author: { id: string; name: string; avatarUrl: string | null };
}

export async function getRecentComments(limit = 5): Promise<RecentComment[]> {
  const rows = await db.query.comments.findMany({
    with: {
      post: { columns: { id: true, title: true, slug: true } },
      author: { columns: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: [desc(comments.createdAt)],
    limit,
  });
  return rows.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    post: c.post,
    author: c.author,
  }));
}

// Admin-only: delete any post by id (no actor checks; route already gates).
export async function adminDeletePost(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
  return result.length > 0 ? { ok: true } : { ok: false, error: "Post not found." };
}
