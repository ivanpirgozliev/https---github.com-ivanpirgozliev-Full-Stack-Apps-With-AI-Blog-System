"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@blog/shared";
import { updateAvatarAction } from "@/app/actions/profile";

interface AvatarUploaderProps {
  currentUrl: string | null;
  name: string;
}

export function AvatarUploader({ currentUrl, name }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Only JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(`Max ${(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/uploads/direct", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message ?? `Upload failed (HTTP ${res.status}).`);
      }
      setUrl(json.data.publicUrl);
      await updateAvatarAction(json.data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUrl(null);
    await updateAvatarAction(null);
  }

  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-accent text-white text-3xl font-bold flex items-center justify-center border-2 border-border">
            {initials}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center disabled:cursor-not-allowed"
          aria-label="Change avatar"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
        </button>

        {url && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-border shadow flex items-center justify-center hover:bg-red-50 transition"
            aria-label="Remove avatar"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_UPLOAD_MIME_TYPES.join(",")}
        onChange={handleSelect}
        className="hidden"
      />

      <p className="text-xs text-muted">Click to change avatar</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
