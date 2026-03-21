"use client";

import { useCallback, useRef, useState, useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, type ActionState } from "@/lib/actions/tasks";
import {
  TASK_PRIORITIES,
  PRIORITY_LABELS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/types/task";

const INPUT_CLASS =
  "h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  projectId?: string;
  onCreated?: () => void;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultStatus = "created",
  projectId,
  onCreated,
}: CreateTaskDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("medium");
  const [taskType, setTaskType] = useState("feature");

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      // Inject select values that don't come from native form
      formData.set("status", status);
      formData.set("priority", priority);
      formData.set("task_type", taskType);
      if (projectId) formData.set("project_id", projectId);

      const result = await createTask(prev, formData);
      if (result.success) {
        onOpenChange(false);
        onCreated?.();
        formRef.current?.reset();
        setStatus(defaultStatus);
        setPriority("medium");
        setTaskType("feature");
      }
      return result;
    },
    {}
  );

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    formRef.current?.reset();
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-xl border border-border bg-card p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground">
            New Task
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new task and assign it to your team.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form ref={formRef} action={formAction} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="create-task-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-task-title"
              name="title"
              required
              placeholder="What needs to be done?"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="create-task-desc"
              className="text-sm font-medium"
            >
              Description
            </Label>
            <Textarea
              id="create-task-desc"
              name="description"
              placeholder="Add details, context, or links..."
              className="min-h-[80px] rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Status + Priority + Type — 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-10 rounded-xl text-sm">
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
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Priority
              </Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Type
              </Label>
              <Select value={taskType} onValueChange={(v) => v && setTaskType(v)}>
                <SelectTrigger className="h-10 rounded-xl text-sm">
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
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label
              htmlFor="create-task-due"
              className="text-xs font-medium text-muted-foreground"
            >
              Due Date
            </Label>
            <Input
              id="create-task-due"
              name="due_date"
              type="date"
              className={INPUT_CLASS + " w-full"}
            />
          </div>

          {/* Error */}
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border -mx-6 px-6 pb-1 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="rounded-full h-10 px-5"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full h-10 px-6"
              disabled={isPending}
            >
              {isPending ? "Creating\u2026" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
