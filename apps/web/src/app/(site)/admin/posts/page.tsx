import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { formatDate, formatNumber } from "@/lib/format";
import { listPosts } from "@/server/services/posts.service";
import { AdminDeletePostButton } from "./delete-button";

export const metadata = { title: "Moderate posts" };

interface AdminPostsPageProps {
  searchParams: Promise<{ page?: string; status?: "draft" | "published" }>;
}

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const { page: pageStr, status } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 25;

  const { items, total } = await listPosts({
    page,
    pageSize,
    status,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <Link href="/admin" className="text-sm text-muted hover:text-accent">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Moderate posts</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString()} total</p>

        <nav className="flex items-center gap-2 mt-4 text-sm">
          <FilterLink active={!status} href="/admin/posts">
            All
          </FilterLink>
          <FilterLink active={status === "published"} href="/admin/posts?status=published">
            Published
          </FilterLink>
          <FilterLink active={status === "draft"} href="/admin/posts?status=draft">
            Drafts
          </FilterLink>
        </nav>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted-bg text-muted uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Views</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-muted-bg/50">
                <td className="px-4 py-3 font-medium max-w-md">
                  <Link
                    href={p.status === "published" ? `/posts/${p.slug}` : `/dashboard/posts/${p.id}/edit`}
                    className="hover:text-accent truncate block"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  <Link href={`/profile/${p.author.id}`} className="flex items-center gap-2 hover:text-accent">
                    {p.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.author.avatarUrl} alt={p.author.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {p.author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {p.author.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.status === "published"
                        ? "text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-1.5 py-0.5 rounded"
                        : "text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted">
                  {formatNumber(p.viewCount)}
                </td>
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {formatDate(p.publishedAt ?? p.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminDeletePostButton postId={p.id} title={p.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        hrefForPage={(p) => `/admin/posts?page=${p}${status ? `&status=${status}` : ""}`}
      />
    </div>
  );
}

function FilterLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-3 py-1.5 rounded-md bg-accent text-white font-medium"
          : "px-3 py-1.5 rounded-md hover:bg-muted-bg text-muted hover:text-foreground transition"
      }
    >
      {children}
    </Link>
  );
}
