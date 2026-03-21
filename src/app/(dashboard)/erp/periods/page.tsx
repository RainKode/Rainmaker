import { createClient } from "@/lib/supabase/server";
import { PeriodsClient } from "./client";

export default async function PeriodsPage() {
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

  const { data: periods } = await supabase
    .from("accounting_periods")
    .select("*")
    .eq("organisation_id", membership.organisation_id)
    .order("start_date", { ascending: false });

  return (
    <PeriodsClient
      initialPeriods={periods ?? []}
      orgId={membership.organisation_id}
      userRole={membership.role}
    />
  );
}
