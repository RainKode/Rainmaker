import { createClient } from "@/lib/supabase/server";
import { MyTasksClient } from "./client";

export default async function MyTasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", user.id)
    .eq("is_active", true)
    .neq("status", "closed")
    .order("due_date", { ascending: true, nullsFirst: false });

  return <MyTasksClient initialTasks={tasks ?? []} userId={user.id} />;
}
