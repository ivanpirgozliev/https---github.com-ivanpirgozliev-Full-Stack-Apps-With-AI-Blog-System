import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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
  const cmd = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
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
