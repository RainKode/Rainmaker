"use client";

import { useCallback, useState } from "react";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Project, Task } from "@/types/task";

type ProjectDetailClientProps = {
  project: Project;
  initialTasks: Task[];
};

export function ProjectDetailClient({
  project,
  initialTasks,
}: ProjectDetailClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) setTasks(data as Task[]);
  }, [project.id]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold">{project.name}</h1>
        <Badge className="rounded-full capitalize">{project.status}</Badge>
      </div>
      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}
      <KanbanBoard tasks={tasks} onRefresh={refresh} />
    </div>
  );
}
