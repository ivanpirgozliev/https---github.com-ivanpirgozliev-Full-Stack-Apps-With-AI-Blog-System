import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { media } from "../db/schema";
import { getBucketName, getPublicBaseUrl, getR2Client } from "../lib/r2";
import { err, ok, type ServiceResult } from "../lib/result";

const PRESIGN_TTL_SECONDS = 300; // 5 minutes — caller must upload within this window.

export interface PresignedUploadResult {
  mediaId: string;
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export async function getUploadPresignedUrl(input: {
  ownerId: string;
  mimeType: string;
  sizeBytes: number;
  filename: string;
}): Promise<ServiceResult<PresignedUploadResult>> {
  const ext = extractExtension(input.filename, input.mimeType);
  const key = `${input.ownerId}/${randomUUID()}${ext}`;

  const s3 = getR2Client();
  // Do NOT include ContentLength here — browsers cannot set Content-Length as
  // a request header (it is forbidden by the Fetch spec), so including it in
  // the signed headers causes R2 to return 403 on every browser PUT.
  const cmd = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: input.mimeType,
  });

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: PRESIGN_TTL_SECONDS });
  } catch (e) {
    console.error("[storage.getUploadPresignedUrl] presign failed", e);
    return err("PRESIGN_FAILED", "Could not generate upload URL.");
  }

  const [row] = await db
    .insert(media)
    .values({
      ownerId: input.ownerId,
      r2Key: key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    })
    .returning({ id: media.id });
  if (!row) return err("INSERT_FAILED", "Could not record media row.");

  return ok({
    mediaId: row.id,
    uploadUrl,
    publicUrl: getPublicUrl(key),
    key,
    expiresIn: PRESIGN_TTL_SECONDS,
  });
}

export function getPublicUrl(key: string): string {
  return `${getPublicBaseUrl()}/${encodeURI(key)}`;
}

/**
 * Server-side direct upload to R2 — avoids browser CORS entirely by routing
 * the file through our Next.js route handler. Used as a fallback when the
 * presigned-URL flow hits CORS issues.
 */
export async function uploadDirectToR2(input: {
  ownerId: string;
  mimeType: string;
  sizeBytes: number;
  filename: string;
  body: Uint8Array;
}): Promise<ServiceResult<{ mediaId: string; publicUrl: string; key: string }>> {
  const ext = extractExtension(input.filename, input.mimeType);
  const key = `${input.ownerId}/${randomUUID()}${ext}`;

  const s3 = getR2Client();
  const params: PutObjectCommandInput = {
    Bucket: getBucketName(),
    Key: key,
    Body: input.body,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
  };

  try {
    await s3.send(new PutObjectCommand(params));
  } catch (e) {
    console.error("[storage.uploadDirectToR2] PUT failed", e);
    const detail =
      e instanceof Error
        ? `${e.name}: ${e.message}`
        : "Unknown error";
    return err("UPLOAD_FAILED", `R2 rejected upload — ${detail}`);
  }

  const [row] = await db
    .insert(media)
    .values({
      ownerId: input.ownerId,
      r2Key: key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    })
    .returning({ id: media.id });
  if (!row) return err("INSERT_FAILED", "Could not record media row.");

  return ok({ mediaId: row.id, publicUrl: getPublicUrl(key), key });
}

export async function deleteObject(key: string): Promise<ServiceResult<{ key: string }>> {
  const s3 = getR2Client();
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }));
  } catch (e) {
    console.error("[storage.deleteObject] delete failed", e);
    return err("DELETE_FAILED", "Could not delete object.");
  }
  await db.delete(media).where(eq(media.r2Key, key));
  return ok({ key });
}

function extractExtension(filename: string, mimeType: string): string {
  const fromName = filename.match(/\.[a-z0-9]{1,5}$/i)?.[0]?.toLowerCase();
  if (fromName) return fromName;
  // Fallback: derive from mime type.
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[mimeType] ?? "";
}
