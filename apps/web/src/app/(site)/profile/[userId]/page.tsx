import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/server/services/posts.service";
import { getUserById } from "@/server/services/users.service";
import { AvatarUploader } from "./avatar-uploader";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return { title: "Profile not found" };
  return { title: `${user.name}'s profile` };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { userId } = await params;
  const { page: pageStr } = await searchParams;

  const [user, currentUser] = await Promise.all([
    getUserById(userId),
    getCurrentUser(),
  ]);
  if (!user) notFound();

  const isOwn = currentUser?.id === userId;

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
      <section className="mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {isOwn ? (
          <AvatarUploader currentUrl={user.avatarUrl ?? null} name={user.name} />
        ) : (
          <div className="shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-accent text-white text-3xl font-bold flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-sm uppercase tracking-wider text-accent font-medium mb-1">Author</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{user.name}</h1>
          <p className="mt-2 text-sm text-muted flex items-center gap-2">
            {user.role === "admin" && (
              <span className="inline-block text-[10px] uppercase tracking-wider bg-accent text-white px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
            {total.toLocaleString()} published post{total === 1 ? "" : "s"}
          </p>
        </div>
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
