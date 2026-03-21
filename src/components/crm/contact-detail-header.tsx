"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import type { ContactWithDetails } from "@/types/crm";

type Props = {
  contact: ContactWithDetails;
};

export function ContactDetailHeader({ contact }: Props) {
  const router = useRouter();
  const initials = `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Back to contacts
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-[var(--accent-secondary)] text-white font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {contact.first_name} {contact.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {contact.email && (
                <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Mail className="size-3.5" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Phone className="size-3.5" />
                  {contact.phone}
                </span>
              )}
              {contact.company && (
                <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Building2 className="size-3.5" />
                  {contact.company.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {contact.pipeline_stage && (
                <Badge
                  className="rounded-full text-xs"
                  style={{
                    backgroundColor: `${contact.pipeline_stage.colour}20`,
                    color: contact.pipeline_stage.colour,
                  }}
                >
                  {contact.pipeline_stage.name}
                </Badge>
              )}
              {contact.department_owner && (
                <Badge variant="outline" className="rounded-full text-xs capitalize border-[var(--border-default)]">
                  {contact.department_owner}
                </Badge>
              )}
              {contact.lead_score > 0 && (
                <Badge
                  variant="secondary"
                  className={`rounded-full text-xs ${
                    contact.lead_score >= 70 ? "text-[#EE6C29]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  Score: {contact.lead_score}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {contact.owner && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>Owner:</span>
            <Avatar className="size-6">
              <AvatarImage src={contact.owner.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] bg-[var(--bg-hover)]">
                {contact.owner.full_name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-[var(--text-secondary)]">
              {contact.owner.full_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
