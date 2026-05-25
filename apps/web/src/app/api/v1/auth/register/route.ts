import { NextResponse } from "next/server";
import { registerSchema } from "@blog/shared";
import { registerUser } from "@/server/services/auth.service";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
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

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return NextResponse.json(result, { status: 409 });
  }
  return NextResponse.json(result, { status: 201 });
}
