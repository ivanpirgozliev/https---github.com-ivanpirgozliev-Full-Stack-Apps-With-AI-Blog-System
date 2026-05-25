import { Search } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { listPosts } from "@/server/services/posts.service";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page: pageStr } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 12;

  const result = query
    ? await listPosts({ page, pageSize, status: "published", search: query })
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Search</h1>
        <form method="GET" className="mt-6 flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search posts by title or excerpt…"
              className="w-full pl-10 pr-3 py-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-md bg-accent text-white font-medium hover:bg-accent-hover transition"
          >
            Search
          </button>
        </form>
      </section>

      {query && result && (
        <section>
          <p className="text-sm text-muted mb-6">
            {result.total.toLocaleString()} result{result.total === 1 ? "" : "s"} for{" "}
            <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
          </p>

          {result.items.length === 0 ? (
            <p className="text-muted text-center py-16">No posts matched your query.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={result.total}
            hrefForPage={(p) => `/search?q=${encodeURIComponent(query)}&page=${p}`}
          />
        </section>
      )}

      {!query && (
        <p className="text-muted">Start typing to search across all published posts.</p>
      )}
    </div>
  );
}
