import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !company) notFound();

  const [contactsRes, dealsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, deal_value, lead_score")
      .eq("company_id", id)
      .eq("is_active", true)
      .order("last_name"),
    supabase
      .from("deals")
      .select("id, name, value, currency, won_at, lost_at, is_active")
      .eq("is_active", true)
      .in(
        "contact_id",
        (
          await supabase
            .from("contacts")
            .select("id")
            .eq("company_id", id)
        ).data?.map((c) => c.id) ?? []
      ),
  ]);

  const contacts = contactsRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const totalDealValue = deals.reduce((sum, d) => sum + ((d.value as number) ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back */}
      <Link
        href="/crm/companies"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Back to companies
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]">
          <Building2 className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {company.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {company.website && (
              <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                <Globe className="size-3.5" />
                {company.website}
              </span>
            )}
            {company.phone && (
              <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                <Phone className="size-3.5" />
                {company.phone}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {company.industry && (
              <Badge variant="outline" className="rounded-full text-xs border-[var(--border-default)]">
                {company.industry}
              </Badge>
            )}
            {company.size && (
              <Badge variant="outline" className="rounded-full text-xs border-[var(--border-default)]">
                {company.size}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-muted)]">Contacts</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-muted)]">Deals</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{deals.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-muted)]">Total Value</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
              minimumFractionDigits: 0,
            }).format(totalDealValue)}
          </p>
        </div>
      </div>

      {/* Contact list */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Contacts
        </h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No contacts linked</p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <Link
                key={c.id}
                href={`/crm/contacts/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 transition-colors hover:border-[var(--border-emphasis)]"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-[var(--accent-secondary)] text-white text-xs">
                      {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {c.first_name} {c.last_name}
                    </p>
                    {c.email && (
                      <p className="text-xs text-[var(--text-muted)]">{c.email}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  Score: {c.lead_score}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {company.notes && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Notes</h2>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
              {company.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
