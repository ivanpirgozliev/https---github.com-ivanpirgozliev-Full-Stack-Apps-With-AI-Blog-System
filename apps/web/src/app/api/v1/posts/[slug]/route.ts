import { NextResponse } from "next/server";
import { updatePostSchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { statusForError } from "@/server/lib/result";
import {
  deletePost,
  getPostBySlug,
  incrementViews,
  updatePost,
} from "@/server/services/posts.service";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Post not found." } },
      { status: 404 },
    );
  }
  // Fire-and-forget: don't block the response on the counter UPDATE.
  void incrementViews(post.id);
  return NextResponse.json({ ok: true, data: post });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  }

  const { slug } = await params;
  const existing = await getPostBySlug(slug);
  if (!existing) {
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

  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const result = await updatePost({
    id: existing.id,
    actorId: user.id,
    actorRole: user.role,
    changes: parsed.data,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: statusForError(result.error.code) });
  }
  return NextResponse.json(result);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  }

  const { slug } = await params;
  const existing = await getPostBySlug(slug);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Post not found." } },
      { status: 404 },
    );
  }

  const result = await deletePost({
    id: existing.id,
    actorId: user.id,
    actorRole: user.role,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: statusForError(result.error.code) });
  }
  return NextResponse.json(result);
}
