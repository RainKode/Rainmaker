"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactWithDetails } from "@/types/crm";

type Props = {
  contacts: ContactWithDetails[];
};

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function ContactTable({ contacts }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-[var(--text-secondary)]">
          No contacts yet
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Add your first contact to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-[var(--border-default)]">
            <TableHead className="font-semibold text-[var(--text-secondary)]">Name</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)]">Company</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)]">Stage</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)] text-right">Deal Value</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)]">Owner</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)]">Last Contact</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)] text-right">Score</TableHead>
            <TableHead className="font-semibold text-[var(--text-secondary)]">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="group cursor-pointer border-b border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <TableCell>
                <Link
                  href={`/crm/contacts/${contact.id}`}
                  className="flex items-center gap-3 min-h-[44px]"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-[var(--accent-secondary)] text-white text-xs">
                      {getInitials(contact.first_name, contact.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {contact.first_name} {contact.last_name}
                    </p>
                    {contact.email && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {contact.email}
                      </p>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-[var(--text-secondary)]">
                {contact.company?.name ?? "—"}
              </TableCell>
              <TableCell>
                {contact.pipeline_stage ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full text-xs"
                    style={{
                      backgroundColor: `${contact.pipeline_stage.colour}20`,
                      color: contact.pipeline_stage.colour,
                    }}
                  >
                    {contact.pipeline_stage.name}
                  </Badge>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium text-[var(--text-primary)]">
                {formatCurrency(contact.deal_value)}
              </TableCell>
              <TableCell>
                {contact.owner ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={contact.owner.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-[var(--bg-hover)]">
                        {contact.owner.full_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {contact.owner.full_name ?? "Unknown"}
                    </span>
                  </div>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </TableCell>
              <TableCell className="text-[var(--text-secondary)]">
                {formatDate(contact.last_contact_date)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`text-sm font-medium ${
                    contact.lead_score >= 70
                      ? "text-[#EE6C29]"
                      : contact.lead_score >= 40
                        ? "text-[var(--accent-secondary)]"
                        : "text-[var(--text-muted)]"
                  }`}
                >
                  {contact.lead_score}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full text-xs border-[var(--border-default)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {contact.tags.length > 3 && (
                    <span className="text-xs text-[var(--text-hint)]">
                      +{contact.tags.length - 3}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
