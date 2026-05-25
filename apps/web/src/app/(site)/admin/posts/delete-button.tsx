"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { adminDeletePostAction } from "@/app/actions/admin";

export function AdminDeletePostButton({ postId, title }: { postId: number; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm(`Delete "${title}"? This cannot be undone.`)) {
          startTransition(async () => {
            try {
              await adminDeletePostAction(postId);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Failed to delete");
            }
          });
        }
      }}
      disabled={pending}
      className="btn-ghost text-red-600 hover:bg-red-50 text-xs"
    >
      <Trash2 size={14} />
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
