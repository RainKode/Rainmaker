import { createClient } from "@/lib/supabase/server";
import { ListClient } from "./client";

export default async function ListPage() {
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

  const [tasksRes, membersRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("organisation_id", membership.organisation_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in(
        "id",
        (
          await supabase
            .from("organisation_memberships")
            .select("user_id")
            .eq("organisation_id", membership.organisation_id)
            .eq("is_active", true)
        ).data?.map((m) => m.user_id) ?? []
      ),
  ]);

  return (
    <ListClient
      initialTasks={tasksRes.data ?? []}
      members={membersRes.data ?? []}
      orgId={membership.organisation_id}
    />
  );
}
