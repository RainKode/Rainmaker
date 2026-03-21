"use client";

import { useCallback, useEffect, useState } from "react";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { subscribeToTasks } from "@/lib/events/realtime";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/types/task";

type BoardClientProps = {
  initialTasks: Task[];
  orgId: string;
};

export function BoardClient({ initialTasks, orgId }: BoardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("created");

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) setTasks(data as Task[]);
  }, [orgId]);

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToTasks(orgId, () => {
      refresh();
    });
    return unsub;
  }, [orgId, refresh]);

  const handleAddTask = useCallback((status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Board</h2>
          <p className="text-xs text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} across all columns
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateStatus("created");
            setCreateOpen(true);
          }}
          className="gap-1.5 rounded-full h-9 px-4"
          size="sm"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New Task
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-4 md:px-6 pb-4">
        <KanbanBoard
          tasks={tasks}
          onRefresh={refresh}
          onAddTask={handleAddTask}
        />
      </div>

      {/* Create dialog */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus={createStatus}
        onCreated={refresh}
      />
    </div>
  );
}
