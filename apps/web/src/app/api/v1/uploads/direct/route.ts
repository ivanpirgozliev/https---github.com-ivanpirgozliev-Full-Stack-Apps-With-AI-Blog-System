import { NextResponse } from "next/server";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { uploadDirectToR2 } from "@/server/services/storage.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid multipart body." } },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: "`file` field is required." } },
      { status: 400 },
    );
  }

  if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: "Unsupported file type." } },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: "File exceeds 5 MB limit." } },
      { status: 400 },
    );
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const result = await uploadDirectToR2({
    ownerId: user.id,
    mimeType: file.type,
    sizeBytes: file.size,
    filename: file.name,
    body: buffer,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 201 });
}
