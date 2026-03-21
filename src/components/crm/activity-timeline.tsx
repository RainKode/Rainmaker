"use client";

import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  UserCheck,
} from "lucide-react";
import type { Message } from "@/types/crm";

type TimelineEntry = {
  id: string;
  type: "message" | "deal" | "comment";
  timestamp: string;
  data: Record<string, unknown>;
};

type Props = {
  messages: Message[];
  deals: Record<string, unknown>[];
  comments: Record<string, unknown>[];
};

export function ActivityTimeline({ messages, deals, comments }: Props) {
  // Merge all into a unified timeline
  const entries: TimelineEntry[] = [
    ...messages.map((m) => ({
      id: m.id,
      type: "message" as const,
      timestamp: m.timestamp,
      data: m as unknown as Record<string, unknown>,
    })),
    ...deals.map((d) => ({
      id: d.id as string,
      type: "deal" as const,
      timestamp: d.created_at as string,
      data: d,
    })),
    ...comments.map((c) => ({
      id: c.id as string,
      type: "comment" as const,
      timestamp: c.created_at as string,
      data: c,
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-8">
        No activity yet
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-[var(--border-default)]" />

      {entries.map((entry) => (
        <div key={entry.id} className="relative flex gap-4 pb-6">
          {/* Dot */}
          <div className="relative z-10 mt-1">
            <div
              className={`flex size-[34px] items-center justify-center rounded-full border-2 border-[var(--bg-base)] ${
                entry.type === "message"
                  ? "bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]"
                  : entry.type === "deal"
                    ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)]"
              }`}
            >
              {entry.type === "message" ? (
                entry.data.direction === "inbound" ? (
                  <ArrowDownLeft className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )
              ) : entry.type === "deal" ? (
                <DollarSign className="size-4" />
              ) : (
                <MessageSquare className="size-4" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {entry.type === "message" && (
                <>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {entry.data.direction === "inbound"
                      ? `Message received via ${entry.data.channel}`
                      : `Message sent via ${entry.data.channel}`}
                  </span>
                  <Badge variant="outline" className="rounded-full text-xs capitalize">
                    {String(entry.data.channel)}
                  </Badge>
                </>
              )}
              {entry.type === "deal" && (
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Deal created: {String(entry.data.name)}
                </span>
              )}
              {entry.type === "comment" && (
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {String((entry.data.user as Record<string, unknown>)?.full_name || "Someone")} left a note
                </span>
              )}
            </div>

            {entry.type === "message" && entry.data.body ? (
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                {String(entry.data.body)}
              </p>
            ) : null}
            {entry.type === "comment" && (
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                {String(entry.data.body)}
              </p>
            )}

            <span className="text-xs text-[var(--text-hint)] mt-1 block">
              {new Date(entry.timestamp).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
