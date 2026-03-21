"use client";

import { useCallback, useEffect, useState } from "react";
import { TaskList } from "@/components/tasks/task-list";
import { FilterBar } from "@/components/tasks/filter-bar";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { subscribeToTasks } from "@/lib/events/realtime";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Task } from "@/types/task";

type ListClientProps = {
  initialTasks: Task[];
  members: { id: string; full_name: string | null }[];
  orgId: string;
};

export function ListClient({ initialTasks, members, orgId }: ListClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  }, [orgId]);

  useEffect(() => {
    const unsub = subscribeToTasks(orgId, () => refresh());
    return unsub;
  }, [orgId, refresh]);

  // Client-side filtering
  const filtered = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (assigneeFilter === "unassigned" && t.assignee_id !== null) return false;
    if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && t.assignee_id !== assigneeFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (typeFilter !== "all" && t.task_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Task List</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 rounded-full h-9 px-4"
          size="sm"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New Task
        </Button>
      </div>

      {/* Filters + List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 space-y-4">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          assigneeFilter={assigneeFilter}
          onAssigneeChange={(v) => setAssigneeFilter(v ?? "all")}
          priorityFilter={priorityFilter}
          onPriorityChange={(v) => setPriorityFilter(v ?? "all")}
          typeFilter={typeFilter}
          onTypeChange={(v) => setTypeFilter(v ?? "all")}
          onClear={() => {
            setSearchQuery("");
            setAssigneeFilter("all");
            setPriorityFilter("all");
            setTypeFilter("all");
          }}
          members={members}
        />

        <TaskList tasks={filtered} onRefresh={refresh} />
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
    </div>
  );
}
