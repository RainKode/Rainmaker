import { createClient } from "@/lib/supabase/server";
import { AccountsClient } from "./client";

export default async function AccountsPage() {
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

  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .eq("organisation_id", membership.organisation_id)
    .order("code", { ascending: true });

  return (
    <AccountsClient
      initialAccounts={accounts ?? []}
      orgId={membership.organisation_id}
      userRole={membership.role}
    />
  );
}
