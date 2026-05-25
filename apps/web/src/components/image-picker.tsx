"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  type PresignUploadResponse,
} from "@blog/shared";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;

    if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(`Image must be under ${(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }

    setUploading(true);
    try {
      const presignRes = await fetch("/api/v1/uploads/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mimeType: file.type,
          sizeBytes: file.size,
          filename: file.name,
        }),
      });
      const presignJson = await presignRes.json();
      if (!presignRes.ok || !presignJson.ok) {
        throw new Error(presignJson.error?.message ?? "Could not start upload.");
      }
      const data = presignJson.data as PresignUploadResponse;

      const putRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`Upload to R2 failed (HTTP ${putRes.status}).`);
      }

      onChange(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Cover preview"
            className="w-full aspect-[16/9] object-cover rounded-md border border-border bg-muted-bg"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-md transition opacity-0 group-hover:opacity-100"
            aria-label="Remove image"
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[16/9] rounded-md border-2 border-dashed border-border hover:border-accent bg-muted-bg/40 hover:bg-muted-bg transition flex flex-col items-center justify-center gap-2 text-muted disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus size={24} />
              <span className="text-sm font-medium">Choose cover image</span>
              <span className="text-xs">JPEG, PNG, WebP, or GIF · up to 5 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_UPLOAD_MIME_TYPES.join(",")}
        onChange={handleSelect}
        className="hidden"
      />

      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-ghost text-xs self-start"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus size={14} />
              Replace image
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
