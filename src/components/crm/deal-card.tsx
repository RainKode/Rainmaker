"use client";

import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { Calendar, User2, DollarSign } from "lucide-react";
import type { DealCardData } from "@/types/crm";

const formatCurrency = (value: number | null, currency: string) => {
  if (!value) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

type DealCardProps = {
  deal: DealCardData;
  onClick?: () => void;
  isDragging?: boolean;
};

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const closeDate = deal.expected_close_date
    ? new Date(deal.expected_close_date)
    : null;
  const isOverdue = closeDate && isPast(closeDate) && !isToday(closeDate);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full cursor-pointer rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3.5 text-left",
        "transition-all duration-200 ease-out",
        "hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)]",
        isDragging &&
          "scale-[1.02] opacity-80 rotate-[1deg] border-[var(--accent-primary)]/40"
      )}
    >
      {/* Deal name */}
      <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
        {deal.name}
      </p>

      {/* Contact name */}
      {deal.contact && (
        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1">
          {deal.contact.first_name} {deal.contact.last_name}
        </p>
      )}

      {/* Value + close date row */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {deal.value ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary)]">
            <DollarSign className="size-3.5" aria-hidden="true" />
            {formatCurrency(deal.value, deal.currency)}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-hint)]">No value</span>
        )}

        {closeDate && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
              isOverdue
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-[var(--text-muted)]"
            )}
          >
            <Calendar className="size-2.5" aria-hidden="true" />
            {format(closeDate, "MMM dd")}
          </span>
        )}
      </div>

      {/* Owner */}
      {deal.owner && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.55rem] font-bold text-[var(--text-muted)]">
            {deal.owner.full_name
              ? deal.owner.full_name.charAt(0).toUpperCase()
              : "?"}
          </div>
          <span className="text-[0.65rem] text-[var(--text-hint)] truncate max-w-[120px]">
            {deal.owner.full_name ?? "Unassigned"}
          </span>
        </div>
      )}
    </button>
  );
}
