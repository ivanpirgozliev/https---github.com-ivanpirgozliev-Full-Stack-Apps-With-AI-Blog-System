import { NextResponse } from "next/server";
import { presignUploadSchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { statusForError } from "@/server/lib/result";
import { getUploadPresignedUrl } from "@/server/services/storage.service";

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

  const parsed = presignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 },
    );
  }

  const result = await getUploadPresignedUrl({
    ownerId: user.id,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
    filename: parsed.data.filename,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: statusForError(result.error.code) });
  }
  return NextResponse.json(result, { status: 201 });
}
