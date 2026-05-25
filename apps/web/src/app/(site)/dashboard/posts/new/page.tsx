import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createPostAction } from "@/app/actions/posts";
import { listCategories } from "@/server/services/categories.service";
import { PostForm } from "../../post-form";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/dashboard" className="text-sm text-muted hover:text-accent inline-flex items-center gap-1 mb-6">
        <ChevronLeft size={14} />
        Back to dashboard
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mb-8">New post</h1>
      <PostForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        serverAction={createPostAction}
        submitLabel="Create post"
      />
    </div>
  );
}
