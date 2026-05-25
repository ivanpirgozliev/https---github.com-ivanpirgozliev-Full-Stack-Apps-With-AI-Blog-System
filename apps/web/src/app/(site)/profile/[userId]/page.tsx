import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { listPosts } from "@/server/services/posts.service";
import { getUserById } from "@/server/services/users.service";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return { title: "Profile not found" };
  return { title: `${user.name}'s posts` };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { userId } = await params;
  const { page: pageStr } = await searchParams;

  const user = await getUserById(userId);
  if (!user) notFound();

  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 9;
  const { items, total } = await listPosts({
    page,
    pageSize,
    status: "published",
    authorId: userId,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10">
        <p className="text-sm uppercase tracking-wider text-accent font-medium mb-2">
          Author
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{user.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {user.role === "admin" && (
            <span className="inline-block text-[10px] uppercase tracking-wider bg-accent text-white px-1.5 py-0.5 rounded mr-2">
              Admin
            </span>
          )}
          {total.toLocaleString()} published post{total === 1 ? "" : "s"}
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
        hrefForPage={(p) => `/profile/${userId}?page=${p}`}
      />
    </div>
  );
}
