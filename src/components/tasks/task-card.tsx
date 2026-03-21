"use client";

import { cn } from "@/lib/utils";
import { Calendar, CheckSquare, MoreHorizontal } from "lucide-react";
import type { TaskCardData } from "@/types/task";
import { PRIORITY_LABELS } from "@/types/task";
import { format, isPast, isToday } from "date-fns";

/* ─── Priority badge colours (from colour-palette.md) ──────────────── */
const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-[#EE6C29] text-white",
  high: "bg-[#EE6C29] text-white",
  medium: "bg-[#3D4141] text-[#D4DADA]",
  low: "bg-[rgba(122,166,179,0.15)] text-[#9EC6D1]",
};

/* ─── Priority dot colours ──────────────────────────────────────────── */
const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-[#EE6C29]",
  high: "bg-[#EE6C29]",
  medium: "bg-[#7AA6B3]",
  low: "bg-[#505555]",
};

type TaskCardProps = {
  task: TaskCardData;
  onClick?: () => void;
  isDragging?: boolean;
};

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const completedCount =
    task.checklist?.filter((c) => c.completed).length ?? 0;
  const totalCount = task.checklist?.length ?? 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full cursor-pointer rounded-xl border border-border bg-card p-3.5 text-left",
        "transition-all duration-200 ease-out",
        "hover:bg-[#3D4141] hover:border-[rgba(255,255,255,0.12)]",
        ".light &:hover:bg-card .light &:hover:border-[rgba(0,0,0,0.14)]",
        isDragging && "scale-[1.02] opacity-80 rotate-[1deg] border-primary/40"
      )}
    >
      {/* Top row: priority badge + menu dots */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider",
            PRIORITY_BADGE[task.priority]
          )}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>

        {/* Due date chip */}
        {dueDate && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
              isOverdue
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Calendar className="size-2.5" aria-hidden="true" />
            {format(dueDate, "MMM dd, yyyy")}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
        {task.title}
      </p>

      {/* Checklist progress bar */}
      {totalCount > 0 && (
        <div className="mt-3 space-y-1">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] text-muted-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
            <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground tabular-nums">
              <CheckSquare className="size-2.5" aria-hidden="true" />
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
      )}

      {/* Bottom row: assignee + menu */}
      <div className="mt-3 flex items-center justify-between">
        {/* Priority dot + assignee */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              PRIORITY_DOT[task.priority]
            )}
            aria-hidden="true"
          />
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[0.6rem] font-bold text-muted-foreground">
                {task.assignee.full_name
                  ? task.assignee.full_name.charAt(0).toUpperCase()
                  : "?"}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {task.assignee.full_name ?? "Unassigned"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">Unassigned</span>
          )}
        </div>

        {/* Context menu trigger (visible on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <MoreHorizontal
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>
    </button>
  );
}
