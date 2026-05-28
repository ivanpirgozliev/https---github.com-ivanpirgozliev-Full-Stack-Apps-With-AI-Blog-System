import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

const REGION = "auto"; // R2 ignores region but the SDK requires one.

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it to apps/web/.env.local.`);
  return v;
}

// Singleton so we don't re-create the client (and its HTTP agent) per request.
let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;
  cached = new S3Client({
    region: REGION,
    endpoint: envRequired("R2_ENDPOINT"),
    credentials: {
      accessKeyId: envRequired("R2_ACCESS_KEY_ID"),
      secretAccessKey: envRequired("R2_SECRET_ACCESS_KEY"),
    },
    // R2 requires path-style addressing (bucket in the URL path, not subdomain).
    forcePathStyle: true,
    // Don't auto-add CRC32 checksum to presigned URLs — R2 rejects PUTs
    // from browser clients that omit the matching x-amz-checksum-crc32 header.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cached;
}

export function getBucketName(): string {
  return envRequired("R2_BUCKET_NAME");
}

export function getPublicBaseUrl(): string {
  return envRequired("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
}
