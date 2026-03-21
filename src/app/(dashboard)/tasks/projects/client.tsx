"use client";

import { useActionState, useCallback, useState } from "react";
import { ProjectCard } from "@/components/tasks/project-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createProject, type ActionState } from "@/lib/actions/projects";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types/task";

type ProjectsClientProps = {
  initialProjects: Project[];
  orgId: string;
};

export function ProjectsClient({
  initialProjects,
  orgId,
}: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data) setProjects(data as Project[]);
  }, [orgId]);

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createProject(prev, formData);
      if (result.success) {
        setDialogOpen(false);
        refresh();
      }
      return result;
    },
    {}
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Projects</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Plus className="size-4" />
            New Project
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input name="name" required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  className="min-h-[60px] rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="date" name="start_date" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>Target End Date</Label>
                  <Input
                    type="date"
                    name="target_end_date"
                    className="rounded-xl"
                  />
                </div>
              </div>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Project"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet. Create one to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
