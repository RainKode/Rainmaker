import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ContactsClient } from "./client";

export default async function ContactsPage() {
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

  const [contactsRes, stagesRes, membersRes] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        `*, company:companies(id, name, domain), pipeline_stage:pipeline_stages(id, name, colour), owner:profiles!contacts_owner_id_fkey(id, full_name, avatar_url)`
      )
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("pipeline_stages")
      .select("id, name, colour, pipeline_id")
      .order("sort_order"),
    supabase
      .from("organisation_memberships")
      .select("user_id, profiles(id, full_name, avatar_url)")
      .eq("organisation_id", orgId)
      .eq("is_active", true),
  ]);

  return (
    <ContactsClient
      initialContacts={contactsRes.data ?? []}
      stages={stagesRes.data ?? []}
      members={
        (membersRes.data ?? []).map((m) => {
          const profile = m.profiles as unknown as {
            id: string;
            full_name: string | null;
            avatar_url: string | null;
          };
          return {
            id: profile?.id ?? m.user_id,
            full_name: profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
          };
        })
      }
      orgId={orgId}
    />
  );
}
