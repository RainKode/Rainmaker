import { createClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./client";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("organisation_id", membership.organisation_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <ProjectsClient
      initialProjects={projects ?? []}
      orgId={membership.organisation_id}
    />
  );
}
