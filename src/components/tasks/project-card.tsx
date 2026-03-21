"use client";

import { cn } from "@/lib/utils";
import type { Project } from "@/types/task";
import { FolderKanban, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[rgba(122,166,179,0.15)] text-[#9EC6D1]",
  completed: "bg-[#EE6C29] text-white",
  archived: "bg-[#3D4141] text-[#D4DADA]",
  on_hold: "bg-[#3D4141] text-[#D4DADA]",
};

type ProjectCardProps = {
  project: Project;
  taskCount?: number;
};

export function ProjectCard({ project, taskCount = 0 }: ProjectCardProps) {
  return (
    <Link
      href={`/tasks/projects/${project.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4 transition-colors",
        "hover:bg-[#3D4141] dark:hover:bg-[#3D4141]",
        "light:hover:border-[rgba(0,0,0,0.14)]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {project.name}
          </h3>
        </div>
        <Badge
          className={cn(
            "rounded-full text-xs",
            STATUS_COLORS[project.status] ?? STATUS_COLORS.active
          )}
        >
          {project.status}
        </Badge>
      </div>

      {project.description && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{taskCount} tasks</span>
        {project.target_end_date && (
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {new Date(project.target_end_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}
