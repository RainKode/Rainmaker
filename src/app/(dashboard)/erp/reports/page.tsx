import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./client";

export default async function ReportsPage() {
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

  // Fetch accounts for report display
  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, code, name, account_type, normal_balance, is_active")
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .order("code", { ascending: true });

  // Fetch periods for period selector
  const { data: periods } = await supabase
    .from("accounting_periods")
    .select("id, name, start_date, end_date, status")
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  // Fetch all journal entry lines for the org (with entry dates)
  const { data: journalLines } = await supabase
    .from("journal_entry_lines")
    .select(
      "account_id, debit, credit, journal_entry:journal_entries!inner(entry_date, organisation_id, is_active)"
    )
    .eq("journal_entry.organisation_id", orgId)
    .eq("journal_entry.is_active", true);

  // Fetch open invoices for AR ageing
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, contact_id, invoice_number, due_date, amount_due, status, currency")
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .in("status", ["sent", "overdue", "partially_paid"]);

  // Fetch contacts for contact names in AR ageing
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name")
    .eq("organisation_id", orgId);

  return (
    <ReportsClient
      accounts={accounts ?? []}
      periods={periods ?? []}
      journalLines={(journalLines as unknown as JournalLineRow[]) ?? []}
      invoices={invoices ?? []}
      contacts={contacts ?? []}
      userRole={membership.role}
    />
  );
}

type JournalLineRow = {
  account_id: string;
  debit: number;
  credit: number;
  journal_entry: {
    entry_date: string;
    organisation_id: string;
    is_active: boolean;
  };
};
