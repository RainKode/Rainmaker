"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createTimeEntry, type ActionState } from "@/lib/actions/time-entries";

type TimeEntryFormProps = {
  taskId: string;
  onSuccess?: () => void;
};

export function TimeEntryForm({ taskId, onSuccess }: TimeEntryFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createTimeEntry(prev, formData);
      if (result.success) onSuccess?.();
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="source" value="manual" />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            name="start_time"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Duration (minutes)
          </Label>
          <Input
            type="number"
            name="duration_minutes"
            min={1}
            placeholder="30"
            required
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          name="notes"
          placeholder="What did you work on?"
          className="min-h-[60px] rounded-xl"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch name="billable" id="billable" />
        <Label htmlFor="billable" className="text-sm">
          Billable
        </Label>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full"
        size="sm"
      >
        {isPending ? "Saving..." : "Log Time"}
      </Button>
    </form>
  );
}
