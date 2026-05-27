"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCommentAction, type CommentActionState } from "@/app/actions/comments";

interface CommentFormProps {
  slug: string;
}

export function CommentForm({ slug }: CommentFormProps) {
  // Bind the slug so the action takes (prevState, formData).
  const action = addCommentAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<CommentActionState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the textarea once a comment posts successfully (no error returned).
  useEffect(() => {
    if (state === undefined && !pending) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="mt-8 flex flex-col gap-3">
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={3}
        placeholder="Add a comment…"
        className="textarea"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-gradient">
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
