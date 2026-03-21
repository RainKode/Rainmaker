"use client";

import { useState, useActionState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/actions/crm";

type Props = {
  contactId: string;
  initialComments: Record<string, unknown>[];
};

export function CommentSection({ contactId, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: string }, formData: FormData) => {
      const result = await createComment(_prev, formData);
      if (result.success) {
        setBody("");
        // Optimistically add the comment
        const newComment = {
          id: crypto.randomUUID(),
          contact_id: contactId,
          body: formData.get("body") as string,
          user: { full_name: "You", avatar_url: null },
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [newComment, ...prev]);
      }
      return result;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {/* Compose */}
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="contact_id" value={contactId} />
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          className="min-h-[80px] rounded-xl border-[var(--border-default)] focus:border-[var(--border-emphasis)] focus:ring-2 focus:ring-[var(--accent-secondary)] resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!body.trim() || isPending}
            className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[#D45A1E] disabled:opacity-50 text-white font-medium rounded-full px-5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7AA6B3] min-h-[44px]"
          >
            {isPending ? "Posting..." : "Add Note"}
          </button>
        </div>
        {state.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}
      </form>

      {/* Comment list */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const user = comment.user as Record<string, unknown> | undefined;
          return (
            <div
              key={comment.id as string}
              className="flex gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={(user?.avatar_url as string) ?? undefined} />
                <AvatarFallback className="text-xs bg-[var(--bg-hover)]">
                  {((user?.full_name as string) ?? "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {(user?.full_name as string) ?? "Unknown"}
                  </span>
                  <span className="text-xs text-[var(--text-hint)]">
                    {new Date(comment.created_at as string).toLocaleString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                  {comment.body as string}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
