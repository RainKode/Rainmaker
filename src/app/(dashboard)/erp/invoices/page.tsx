import { createClient } from "@/lib/supabase/server";
import { InvoicesClient } from "./client";

export default async function InvoicesPage() {
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

  const [invoicesRes, contactsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, invoice_line_items(*)")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("first_name", { ascending: true }),
  ]);

  return (
    <InvoicesClient
      initialInvoices={invoicesRes.data ?? []}
      contacts={contactsRes.data ?? []}
      orgId={orgId}
      userRole={membership.role}
    />
  );
}
