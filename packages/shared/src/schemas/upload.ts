import { z } from "zod";

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const presignUploadSchema = z.object({
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
  filename: z.string().min(1).max(255),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export interface PresignUploadResponse {
  mediaId: string;
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}
