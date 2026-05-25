import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { listPosts } from "@/server/services/posts.service";

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 12;

  const { items, total } = await listPosts({
    page,
    pageSize,
    status: "published",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Latest posts
        </h1>
        <p className="mt-2 text-muted">
          Stories, notes, and explorations from across the blog.
        </p>
      </section>

      {items.length === 0 ? (
        <p className="text-muted text-center py-16">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        hrefForPage={(p) => `/?page=${p}`}
      />
    </div>
  );
}
