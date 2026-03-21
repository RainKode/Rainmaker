import { createClient } from "@/lib/supabase/server";
import { JournalsClient } from "./client";

export default async function JournalsPage() {
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

  const [journalsRes, periodsRes, accountsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*, journal_entry_lines(*, chart_of_accounts(id, code, name))")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("entry_date", { ascending: false })
      .limit(50),
    supabase
      .from("accounting_periods")
      .select("id, name, status")
      .eq("organisation_id", orgId)
      .order("start_date", { ascending: false }),
    supabase
      .from("chart_of_accounts")
      .select("id, code, name, account_type")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("code", { ascending: true }),
  ]);

  return (
    <JournalsClient
      initialEntries={journalsRes.data ?? []}
      periods={periodsRes.data ?? []}
      accounts={accountsRes.data ?? []}
      orgId={orgId}
      userRole={membership.role}
    />
  );
}
