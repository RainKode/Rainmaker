"use client";

import { useCallback, useState } from "react";
import { MyTaskRow } from "@/components/tasks/my-task-row";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/types/task";
import { isToday, isPast, isThisWeek } from "date-fns";

type MyTasksClientProps = {
  initialTasks: Task[];
  userId: string;
};

type Section = {
  label: string;
  tasks: Task[];
};

function groupTasks(tasks: Task[]): Section[] {
  const overdue: Task[] = [];
  const today: Task[] = [];
  const thisWeek: Task[] = [];
  const noDue: Task[] = [];
  const later: Task[] = [];

  for (const t of tasks) {
    if (t.status === "completed") continue;
    if (!t.due_date) {
      noDue.push(t);
      continue;
    }
    const d = new Date(t.due_date);
    if (isPast(d) && !isToday(d)) {
      overdue.push(t);
    } else if (isToday(d)) {
      today.push(t);
    } else if (isThisWeek(d)) {
      thisWeek.push(t);
    } else {
      later.push(t);
    }
  }

  return [
    { label: "Overdue", tasks: overdue },
    { label: "Today", tasks: today },
    { label: "This Week", tasks: thisWeek },
    { label: "Later", tasks: later },
    { label: "No Due Date", tasks: noDue },
  ].filter((s) => s.tasks.length > 0);
}

export function MyTasksClient({ initialTasks, userId }: MyTasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignee_id", userId)
      .eq("is_active", true)
      .neq("status", "closed")
      .order("due_date", { ascending: true, nullsFirst: false });
    if (data) setTasks(data as Task[]);
  }, [userId]);

  const sections = groupTasks(tasks);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-lg font-bold">My Tasks</h1>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tasks assigned to you.
        </p>
      )}

      {sections.map((section) => (
        <div key={section.label} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {section.label}{" "}
            <span className="text-xs font-normal">({section.tasks.length})</span>
          </h2>
          <div className="space-y-1.5">
            {section.tasks.map((task) => (
              <MyTaskRow
                key={task.id}
                task={task}
                onComplete={refresh}
                onOpen={(t) => {
                  setSelectedTask(t);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={refresh}
      />
    </div>
  );
}
