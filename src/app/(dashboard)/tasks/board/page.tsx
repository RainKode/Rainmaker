import { createClient } from "@/lib/supabase/server";
import { BoardClient } from "./client";
import type { Task } from "@/types/task";

export default async function BoardPage() {
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

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("organisation_id", membership.organisation_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return <BoardClient initialTasks={(tasks ?? []) as Task[]} orgId={membership.organisation_id} />;
}
