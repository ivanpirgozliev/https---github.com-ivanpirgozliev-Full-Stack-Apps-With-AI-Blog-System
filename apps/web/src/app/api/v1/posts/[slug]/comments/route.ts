import { NextResponse } from "next/server";
import { addCommentSchema, listCommentsQuerySchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { statusForError } from "@/server/lib/result";
import { addComment, listCommentsForPost } from "@/server/services/comments.service";
import { getPostBySlug } from "@/server/services/posts.service";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Post not found." } },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const parsed = listCommentsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid query" } },
      { status: 400 },
    );
  }

  const result = await listCommentsForPost({ postId: post.id, ...parsed.data });
  return NextResponse.json({ ok: true, data: result });
}

export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Post not found." } },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const parsed = addCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const result = await addComment({
    postId: post.id,
    authorId: user.id,
    ...parsed.data,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: statusForError(result.error.code) });
  }
  return NextResponse.json(result, { status: 201 });
}
