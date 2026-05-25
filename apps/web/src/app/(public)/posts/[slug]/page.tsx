import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, MessageCircle } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { formatDate, formatNumber } from "@/lib/format";
import { listCommentsForPost } from "@/server/services/comments.service";
import { getPostBySlug, incrementViews } from "@/server/services/posts.service";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") {
    notFound();
  }

  // Increment views; don't block the page on it.
  void incrementViews(post.id);

  const comments = await listCommentsForPost({ postId: post.id, pageSize: 50 });

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm mb-4">
          {post.category && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="font-medium uppercase tracking-wider text-accent hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          {post.category && <span className="text-muted">·</span>}
          <time className="text-muted">{formatDate(post.publishedAt ?? post.createdAt)}</time>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-4 text-lg text-muted leading-relaxed">{post.excerpt}</p>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-muted border-t border-b border-border py-4">
          <span>By {post.author.name}</span>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {formatNumber(post.viewCount)} views
          </span>
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="mb-8 -mx-4 sm:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt=""
            className="w-full aspect-[16/9] object-cover rounded-lg"
          />
        </div>
      )}

      <MarkdownContent>{post.content}</MarkdownContent>

      <section className="mt-16 pt-8 border-t border-border">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <MessageCircle size={20} />
          Comments ({comments.total})
        </h2>

        {comments.items.length === 0 ? (
          <p className="text-muted">No comments yet.</p>
        ) : (
          <ul className="space-y-6">
            {comments.items.map((c) => (
              <li key={c.id} className="border-b border-border pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{c.author.name}</span>
                  <time className="text-xs text-muted">{formatDate(c.createdAt)}</time>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 p-4 rounded-md bg-muted-bg text-sm text-muted text-center">
          <Link href={`/auth/login?redirect=/posts/${post.slug}`} className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      </section>
    </article>
  );
}
