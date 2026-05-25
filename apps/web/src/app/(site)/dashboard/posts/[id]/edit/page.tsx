import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { deletePostAction, updatePostAction } from "@/app/actions/posts";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/server/services/categories.service";
import { getPostById } from "@/server/services/posts.service";
import { PostForm } from "../../../post-form";
import { DeletePostButton } from "./delete-post-button";

export const metadata = { title: "Edit post" };

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId)) notFound();

  const user = (await getCurrentUser())!;
  const [post, categories] = await Promise.all([getPostById(numericId), listCategories()]);
  if (!post) notFound();

  if (post.authorId !== user.id && user.role !== "admin") {
    // Not your post and not admin — kick back to dashboard.
    redirect("/dashboard");
  }

  // Bind the slug into the Server Actions so the form action takes (prev, fd).
  const boundUpdate = updatePostAction.bind(null, post.slug);
  const boundDelete = deletePostAction.bind(null, post.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-muted hover:text-accent inline-flex items-center gap-1 mb-6"
      >
        <ChevronLeft size={14} />
        Back to dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit post</h1>
        <DeletePostButton action={boundDelete} />
      </div>

      <PostForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          title: post.title,
          content: post.content,
          excerpt: post.excerpt ?? "",
          coverImageUrl: post.coverImageUrl ?? "",
          categoryId: post.categoryId ? String(post.categoryId) : "",
          status: post.status,
        }}
        serverAction={boundUpdate}
        submitLabel="Save changes"
      />
    </div>
  );
}
