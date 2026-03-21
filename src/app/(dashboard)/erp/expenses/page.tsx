import { createClient } from "@/lib/supabase/server";
import { ExpensesClient } from "./client";

export default async function ExpensesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) return null;

  const orgId = membership.organisation_id;

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, submitter:profiles!expenses_submitted_by_fkey(id, full_name, avatar_url)")
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <ExpensesClient
      initialExpenses={expenses ?? []}
      orgId={orgId}
      userId={user.id}
      userRole={membership.role}
    />
  );
}
