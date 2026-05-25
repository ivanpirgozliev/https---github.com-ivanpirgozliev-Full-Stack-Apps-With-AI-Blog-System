import { NextResponse } from "next/server";
import { createPostSchema, listPostsQuerySchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { statusForError } from "@/server/lib/result";
import { createPost, listPosts } from "@/server/services/posts.service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = listPostsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid query" } },
      { status: 400 },
    );
  }
  const result = await listPosts(parsed.data);
  return NextResponse.json({ ok: true, data: result });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
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

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const result = await createPost({ authorId: user.id, ...parsed.data });
  if (!result.ok) {
    return NextResponse.json(result, { status: statusForError(result.error.code) });
  }
  return NextResponse.json(result, { status: 201 });
}
