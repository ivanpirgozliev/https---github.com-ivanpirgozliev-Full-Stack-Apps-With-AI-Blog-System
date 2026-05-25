import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { statusForError } from "@/server/lib/result";
import { deleteComment } from "@/server/services/comments.service";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: "Invalid comment id." } },
      { status: 400 },
    );
  }

  const result = await deleteComment({
    id: numericId,
    actorId: user.id,
    actorRole: user.role,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: statusForError(result.error.code) });
  }
  return NextResponse.json(result);
}
