"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type LinkedTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project: { name: string } | null;
};

type Props = {
  contactId?: string;
  dealId?: string;
};

const STATUS_DOT: Record<string, string> = {
  created: "bg-[#505555]",
  assigned: "bg-[#7AA6B3]",
  in_progress: "bg-[#EE6C29]",
  in_review: "bg-[#9EC6D1]",
  completed: "bg-[#3D4141]",
};

export function LinkedTasksPanel({ contactId, dealId }: Props) {
  const [tasks, setTasks] = useState<LinkedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      const supabase = createClient();

      let query = supabase
        .from("projects")
        .select(
          "id, name, tasks(id, title, status, priority, due_date)"
        )
        .eq("is_active", true);

      if (contactId) query = query.eq("contact_id", contactId);
      if (dealId) query = query.eq("deal_id", dealId);

      const { data } = await query;

      const linked: LinkedTask[] = [];
      for (const project of data ?? []) {
        const projectTasks = (project.tasks as unknown as LinkedTask[]) ?? [];
        for (const t of projectTasks) {
          linked.push({ ...t, project: { name: project.name } });
        }
      }
      setTasks(linked);
      setLoading(false);
    }

    if (contactId || dealId) fetchTasks();
    else setLoading(false);
  }, [contactId, dealId]);

  if (loading) {
    return (
      <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="size-5 border-2 border-t-transparent border-[var(--accent-primary)] rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <ListTodo className="size-4" />
          Linked Tasks
          {tasks.length > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full text-[0.6rem]"
            >
              {tasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks?taskId=${task.id}`}
            className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors min-h-[44px] group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`size-2 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? "bg-muted"}`}
              />
              <span className="text-sm text-[var(--text-primary)] truncate">
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {task.due_date && (
                <span className="text-[0.6rem] text-[var(--text-hint)]">
                  {format(new Date(task.due_date), "MMM dd")}
                </span>
              )}
              <ExternalLink className="size-3.5 text-[var(--text-hint)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}

        {tasks.length === 0 && (
          <p className="text-xs text-[var(--text-hint)] text-center py-3">
            No linked tasks
          </p>
        )}
      </CardContent>
    </Card>
  );
}
