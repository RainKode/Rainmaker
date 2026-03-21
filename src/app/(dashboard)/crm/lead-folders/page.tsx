import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeadFoldersClient } from "@/components/crm/lead-folder-list";

export default async function LeadFoldersPage() {
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

  const { data: folders } = await supabase
    .from("lead_folders")
    .select("*")
    .eq("organisation_id", membership.organisation_id)
    .order("submitted_at", { ascending: false });

  return <LeadFoldersClient folders={folders ?? []} />;
}
