import Link from "next/link";
import { PenSquare, Plus } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/server/services/posts.service";
import { Pagination } from "@/components/pagination";

export const metadata = { title: "Dashboard" };

interface DashboardPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Middleware enforces auth, but services also re-check. Non-null assertion is safe here.
  const user = (await getCurrentUser())!;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 20;

  const { items, total } = await listPosts({
    page,
    pageSize,
    authorId: user.id,
    // No status filter — show drafts + published together
  });

  const drafts = items.filter((p) => p.status === "draft").length;
  const published = items.filter((p) => p.status === "published").length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted mb-1">Welcome back, {user.name}</p>
          <h1 className="text-3xl font-bold tracking-tight">Your posts</h1>
          <p className="mt-1 text-sm text-muted">
            {total.toLocaleString()} total on this page · {published} published · {drafts} drafts
          </p>
        </div>
        <Link href="/dashboard/posts/new" className="btn-gradient">
          <Plus size={16} />
          New post
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted mb-4">You haven&apos;t written anything yet.</p>
          <Link href="/dashboard/posts/new" className="btn-gradient">
            <Plus size={16} />
            Write your first post
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((post) => (
            <li key={post.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImageUrl}
                    alt=""
                    className="w-20 h-14 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-20 h-14 rounded shrink-0 bg-muted-bg" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted mb-1">
                    <StatusBadge status={post.status} />
                    <span>·</span>
                    <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                    <span>·</span>
                    <span>{formatNumber(post.viewCount)} views</span>
                  </div>
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="font-semibold truncate block hover:text-accent transition"
                  >
                    {post.title}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {post.status === "published" && (
                  <Link
                    href={`/posts/${post.slug}`}
                    className="btn-ghost text-xs"
                    target="_blank"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/dashboard/posts/${post.id}/edit`}
                  className="btn-ghost text-xs"
                >
                  <PenSquare size={14} />
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        hrefForPage={(p) => `/dashboard?page=${p}`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <span className="inline-block text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
        Published
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
      Draft
    </span>
  );
}
