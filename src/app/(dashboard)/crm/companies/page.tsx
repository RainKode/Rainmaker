import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function CompaniesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) redirect("/onboarding");

  const { data: companies } = await supabase
    .from("companies")
    .select("*, contacts:contacts(count)")
    .eq("organisation_id", membership.organisation_id)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            {companies?.length ?? 0} compan{(companies?.length ?? 0) !== 1 ? "ies" : "y"}
          </p>
        </div>
        <Link
          href="/crm/companies?new=true"
          className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[#D45A1E] active:bg-[#8F3C12] text-white font-medium rounded-full px-5 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7AA6B3] min-h-[44px]"
        >
          <Plus className="size-4" />
          Add Company
        </Link>
      </div>

      {(!companies || companies.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="size-10 text-[var(--text-hint)] mb-3" />
          <p className="text-lg font-medium text-[var(--text-secondary)]">
            No companies yet
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add your first company to organize contacts
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const contactCount =
              (company.contacts as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link
                key={company.id}
                href={`/crm/companies/${company.id}`}
                className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-emphasis)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {company.name}
                      </p>
                      {company.industry && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {company.industry}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  {company.size && (
                    <Badge variant="outline" className="rounded-full text-xs border-[var(--border-default)]">
                      {company.size}
                    </Badge>
                  )}
                  <span>{contactCount} contact{contactCount !== 1 ? "s" : ""}</span>
                </div>
                {company.domain && (
                  <p className="mt-2 text-xs text-[var(--text-hint)] truncate">
                    {company.domain}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
