"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Play,
  Tag,
  Trash2,
  Plus,
  X,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { useTimerStore } from "@/lib/stores/timer-store";
import type { Task, ChecklistItem } from "@/types/task";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  PRIORITY_LABELS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
} from "@/types/task";
import { format, formatDistanceToNow } from "date-fns";

/* ─── Priority badge (matches card) ────────────────────────────────── */
const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-[#EE6C29] text-white",
  high: "bg-[#EE6C29] text-white",
  medium: "bg-[#3D4141] text-[#D4DADA]",
  low: "bg-[rgba(122,166,179,0.15)] text-[#9EC6D1]",
};

/* ─── Status dot ───────────────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  created: "bg-[#505555]",
  assigned: "bg-[#7AA6B3]",
  in_progress: "bg-[#EE6C29]",
  in_review: "bg-[#9EC6D1]",
  completed: "bg-[#3D4141]",
  blocked: "bg-destructive",
  on_hold: "bg-[#505555]",
  closed: "bg-[#505555]",
};

type TaskDrawerProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function TaskDrawer({
  task,
  open,
  onOpenChange,
  onUpdated,
}: TaskDrawerProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const timerStore = useTimerStore();

  useEffect(() => {
    if (task) setTitle(task.title);
  }, [task]);

  const handleFieldUpdate = useCallback(
    async (field: string, value: unknown) => {
      if (!task) return;
      await updateTask({ id: task.id, [field]: value });
      onUpdated?.();
    },
    [task, onUpdated]
  );

  const handleTitleBlur = useCallback(() => {
    if (!task || title === task.title) return;
    handleFieldUpdate("title", title);
  }, [task, title, handleFieldUpdate]);

  const handleStartTimer = useCallback(() => {
    if (!task) return;
    timerStore.start(task.id, task.title);
  }, [task, timerStore]);

  const handleDelete = useCallback(async () => {
    if (!task) return;
    await deleteTask(task.id);
    onOpenChange(false);
    onUpdated?.();
  }, [task, onOpenChange, onUpdated]);

  const handleChecklistToggle = useCallback(
    (itemId: string) => {
      if (!task) return;
      const updated = (task.checklist as ChecklistItem[]).map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      handleFieldUpdate("checklist", updated);
    },
    [task, handleFieldUpdate]
  );

  const handleAddChecklistItem = useCallback(() => {
    if (!task) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: "",
      completed: false,
    };
    handleFieldUpdate("checklist", [
      ...(task.checklist as ChecklistItem[]),
      newItem,
    ]);
  }, [task, handleFieldUpdate]);

  const handleTagRemove = useCallback(
    (tag: string) => {
      if (!task) return;
      handleFieldUpdate(
        "tags",
        task.tags.filter((t) => t !== tag)
      );
    },
    [task, handleFieldUpdate]
  );

  if (!task) return null;

  const checklist = (task.checklist ?? []) as ChecklistItem[];
  const checklistDone = checklist.filter((c) => c.completed).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[620px] overflow-y-auto p-0 gap-0 border-l border-border bg-card">
        <SheetHeader className="sr-only">
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>

        {/* ── Header bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Bookmark"
              className="rounded-full"
            >
              <Star className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="More options"
              className="rounded-full"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        {/* ── Title ──────────────────────────────────────── */}
        <div className="px-5 pt-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-xl font-bold border-none px-0 h-auto py-0 rounded-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground"
            placeholder="Task title..."
          />
        </div>

        {/* ── Metadata grid ──────────────────────────────── */}
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-3 items-center text-sm">
            {/* Status */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <div
                className={cn(
                  "size-2 rounded-full",
                  STATUS_DOT[task.status] ?? "bg-muted"
                )}
              />
              Status
            </span>
            <Select
              value={task.status}
              onValueChange={(v) => handleFieldUpdate("status", v)}
            >
              <SelectTrigger className="h-8 w-[160px] rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <span className="text-muted-foreground">Priority</span>
            <Select
              value={task.priority}
              onValueChange={(v) => handleFieldUpdate("priority", v)}
            >
              <SelectTrigger className="h-8 w-[120px] rounded-xl text-xs border-none p-0">
                <Badge
                  className={cn(
                    "rounded-full text-xs",
                    PRIORITY_BADGE[task.priority]
                  )}
                >
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <span className="text-muted-foreground">Type</span>
            <Select
              value={task.task_type}
              onValueChange={(v) => handleFieldUpdate("task_type", v)}
            >
              <SelectTrigger className="h-8 w-[120px] rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TASK_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Due date */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3" aria-hidden="true" />
              Due Date
            </span>
            <Input
              type="date"
              value={task.due_date?.split("T")[0] ?? ""}
              onChange={(e) =>
                handleFieldUpdate(
                  "due_date",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null
                )
              }
              className="h-8 w-[160px] rounded-xl text-xs"
            />

            {/* Start date */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3" aria-hidden="true" />
              Start Date
            </span>
            <Input
              type="date"
              value={task.start_date?.split("T")[0] ?? ""}
              onChange={(e) =>
                handleFieldUpdate(
                  "start_date",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null
                )
              }
              className="h-8 w-[160px] rounded-xl text-xs"
            />

            {/* Time estimate */}
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3" aria-hidden="true" />
              Estimate
            </span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={task.time_estimate_minutes ?? ""}
                onChange={(e) =>
                  handleFieldUpdate(
                    "time_estimate_minutes",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="h-8 w-[80px] rounded-xl text-xs"
                min={0}
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>

            {/* Tags */}
            <span className="text-muted-foreground flex items-center gap-1.5 self-start pt-1">
              <Tag className="size-3" aria-hidden="true" />
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 rounded-full text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="hover:text-destructive min-w-[20px] min-h-[20px] inline-flex items-center justify-center"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
              {task.tags.length === 0 && (
                <span className="text-xs text-muted-foreground/50">
                  No tags
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Description ────────────────────────────────── */}
        <div className="px-5 py-4 space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Description
          </Label>
          <Textarea
            value={
              typeof task.description === "string"
                ? task.description
                : task.description
                  ? JSON.stringify(task.description)
                  : ""
            }
            onChange={(e) => handleFieldUpdate("description", e.target.value)}
            className="min-h-[100px] rounded-xl text-sm resize-none"
            placeholder="Add a description..."
          />
        </div>

        <Separator />

        {/* ── Checklist ──────────────────────────────────── */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">
              Checklist
              {checklist.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                  {checklistDone}/{checklist.length}
                </span>
              )}
            </Label>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleAddChecklistItem}
              aria-label="Add checklist item"
              className="rounded-full"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          {/* Progress bar */}
          {checklist.length > 0 && (
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{
                  width: `${(checklistDone / checklist.length) * 100}%`,
                }}
              />
            </div>
          )}

          <div className="space-y-1">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 min-h-[36px]"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleChecklistToggle(item.id)}
                />
                <span
                  className={cn(
                    "text-sm flex-1",
                    item.completed &&
                      "line-through text-muted-foreground"
                  )}
                >
                  {item.text || "New item"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Actions ────────────────────────────────────── */}
        <div className="px-5 py-4 flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleStartTimer}
            className="gap-1.5 rounded-full"
            disabled={
              timerStore.isRunning && timerStore.taskId === task.id
            }
          >
            <Play className="size-3.5" aria-hidden="true" />
            {timerStore.isRunning && timerStore.taskId === task.id
              ? "Timer running"
              : "Start Timer"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5 rounded-full"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </Button>
        </div>

        {/* ── Meta ───────────────────────────────────────── */}
        <div className="px-5 pb-6 pt-2 text-xs text-muted-foreground space-y-0.5">
          <p>
            Created{" "}
            {format(new Date(task.created_at), "MMM d, yyyy")} &middot;{" "}
            {formatDistanceToNow(new Date(task.created_at), {
              addSuffix: true,
            })}
          </p>
          {task.completed_at && (
            <p>
              Completed{" "}
              {formatDistanceToNow(new Date(task.completed_at), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
