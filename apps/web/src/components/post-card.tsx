import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import type { PublicPostWithRefs } from "@blog/shared";
import { formatDate, formatNumber } from "@/lib/format";

export function PostCard({ post }: { post: PublicPostWithRefs }) {
  return (
    <article className="card group flex flex-col">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="aspect-[16/9] bg-muted-bg overflow-hidden">
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <span className="text-xs uppercase tracking-wider">No cover</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col p-4 sm:p-5 gap-3">
        <div className="flex items-center gap-2 text-xs">
          {post.category ? (
            <Link
              href={`/categories/${post.category.slug}`}
              className="font-medium uppercase tracking-wider text-accent hover:underline"
            >
              {post.category.name}
            </Link>
          ) : (
            <span className="text-muted uppercase tracking-wider">Uncategorized</span>
          )}
          <span className="text-muted">·</span>
          <time className="text-muted">{formatDate(post.publishedAt ?? post.createdAt)}</time>
        </div>

        <Link href={`/posts/${post.slug}`}>
          <h2 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-accent transition">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-sm text-muted line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted mt-auto pt-3 border-t border-border">
          <span className="truncate">By {post.author.name}</span>
          <span className="flex items-center gap-1 shrink-0">
            <Eye size={14} />
            {formatNumber(post.viewCount)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card flex flex-col">
      <div className="aspect-[16/9] bg-muted-bg animate-pulse" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-20 bg-muted-bg rounded animate-pulse" />
        <div className="h-5 w-full bg-muted-bg rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted-bg rounded animate-pulse" />
      </div>
    </div>
  );
}

// Suppress unused warning for icons not used everywhere
void MessageCircle;
