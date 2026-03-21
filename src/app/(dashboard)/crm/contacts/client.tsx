"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContactTable } from "@/components/crm/contact-table";
import { ContactFilters } from "@/components/crm/contact-filters";
import { subscribeToContacts } from "@/lib/events/realtime";
import { useEffect } from "react";
import { Plus } from "lucide-react";
import type { ContactWithDetails } from "@/types/crm";

type Props = {
  initialContacts: ContactWithDetails[];
  stages: { id: string; name: string; colour: string; pipeline_id: string }[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  orgId: string;
};

export function ContactsClient({
  initialContacts,
  stages,
  members,
  orgId,
}: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [filters, setFilters] = useState<{
    search?: string;
    department?: string;
    stage_id?: string;
    owner_id?: string;
  }>({});

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToContacts(orgId, () => {
      router.refresh();
    });
    return unsub;
  }, [orgId, router]);

  // Filter locally for instant feedback
  const filtered = contacts.filter((c) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    if (filters.department && c.department_owner !== filters.department) return false;
    if (filters.stage_id && c.pipeline_stage_id !== filters.stage_id) return false;
    if (filters.owner_id && c.owner_id !== filters.owner_id) return false;
    return true;
  });

  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => setFilters(newFilters),
    []
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => router.push("/crm/contacts?new=true")}
          className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[#D45A1E] active:bg-[#8F3C12] text-white font-medium rounded-full px-5 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7AA6B3] min-h-[44px]"
        >
          <Plus className="size-4" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <ContactFilters
        stages={stages}
        members={members}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Table */}
      <ContactTable contacts={filtered} />
    </div>
  );
}
