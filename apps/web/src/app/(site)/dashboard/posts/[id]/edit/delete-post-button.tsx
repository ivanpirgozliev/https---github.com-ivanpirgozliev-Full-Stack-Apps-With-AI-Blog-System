"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeletePostButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Delete this post? This cannot be undone.")) {
          startTransition(async () => {
            await action();
          });
        }
      }}
      disabled={pending}
      className="btn-ghost text-red-600 hover:bg-red-50"
    >
      <Trash2 size={14} />
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
