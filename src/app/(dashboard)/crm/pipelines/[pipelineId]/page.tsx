import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PipelineKanbanClient } from "./client";

export default async function PipelineKanbanPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) redirect("/onboarding");

  const orgId = membership.organisation_id;

  // Fetch pipeline with stages
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("*, stages:pipeline_stages(*)")
    .eq("id", pipelineId)
    .single();

  if (error || !pipeline) notFound();

  // Fetch deals with contacts
  const { data: deals } = await supabase
    .from("deals")
    .select(
      `*, contact:contacts(id, first_name, last_name), owner:profiles!deals_owner_id_fkey(full_name, avatar_url), stage:pipeline_stages(name, colour)`
    )
    .eq("pipeline_id", pipelineId)
    .eq("is_active", true)
    .order("sort_order");

  return (
    <PipelineKanbanClient
      pipeline={pipeline}
      stages={
        (
          pipeline.stages as Pick<import("@/types/crm").PipelineStage, "id" | "name" | "colour" | "sort_order" | "probability" | "pipeline_id" | "position" | "entry_conditions" | "exit_conditions" | "department_owner" | "project_template_id" | "is_active" | "created_at" | "updated_at">[]
        )?.sort((a, b) => a.sort_order - b.sort_order) ?? []
      }
      initialDeals={deals ?? []}
      orgId={orgId}
    />
  );
}
