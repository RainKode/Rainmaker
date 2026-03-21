"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Calendar } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timer-store";
import { updateTaskStatus } from "@/lib/actions/tasks";
import type { Task } from "@/types/task";
import { PRIORITY_LABELS } from "@/types/task";
import { formatDistanceToNow } from "date-fns";

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-[#EE6C29]",
  high: "bg-[#EE6C29]",
  medium: "bg-[#7AA6B3]",
  low: "bg-[#3D4141]",
};

type MyTaskRowProps = {
  task: Task;
  onComplete: () => void;
  onOpen: (task: Task) => void;
};

export function MyTaskRow({ task, onComplete, onOpen }: MyTaskRowProps) {
  const timerStore = useTimerStore();

  const handleComplete = async () => {
    await updateTaskStatus(task.id, "completed");
    onComplete();
  };

  const handleStartTimer = () => {
    timerStore.start(task.id, task.title);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-[#3D4141] dark:hover:bg-[#3D4141] light:hover:border-[rgba(0,0,0,0.14)]">
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={handleComplete}
        aria-label="Complete task"
      />

      {/* Priority dot */}
      <div
        className={cn("size-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])}
        title={PRIORITY_LABELS[task.priority]}
      />

      {/* Title */}
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex-1 text-left text-sm font-medium text-foreground hover:text-primary truncate"
      >
        {task.title}
      </button>

      {/* Due date */}
      {task.due_date && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Calendar className="size-3" />
          {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
        </span>
      )}

      {/* Timer start */}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleStartTimer}
        disabled={timerStore.isRunning && timerStore.taskId === task.id}
        aria-label="Start timer"
      >
        <Play className="size-3" />
      </Button>
    </div>
  );
}
