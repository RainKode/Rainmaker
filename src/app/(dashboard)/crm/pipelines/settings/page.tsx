import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PipelineSettingsClient } from "@/components/crm/pipeline-settings";

export default async function PipelineSettingsPage() {
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

  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("*, stages:pipeline_stages(*)")
    .eq("organisation_id", membership.organisation_id)
    .eq("is_active", true)
    .order("created_at");

  return (
    <PipelineSettingsClient
      pipelines={pipelines ?? []}
    />
  );
}
