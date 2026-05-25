import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { getCategoryBySlug } from "@/server/services/categories.service";
import { listPosts } from "@/server/services/posts.service";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description ?? `Posts in ${category.name}`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 12;

  const { items, total } = await listPosts({
    page,
    pageSize,
    status: "published",
    categorySlug: slug,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10">
        <p className="text-sm uppercase tracking-wider text-accent font-medium mb-2">
          Category
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-3 text-muted max-w-2xl">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-muted">{total.toLocaleString()} posts</p>
      </section>

      {items.length === 0 ? (
        <p className="text-muted text-center py-16">No posts in this category yet.</p>
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
        hrefForPage={(p) => `/categories/${slug}?page=${p}`}
      />
    </div>
  );
}
