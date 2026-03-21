"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { DEPARTMENT_OWNERS, DEPARTMENT_OWNER_LABELS } from "@/types/crm";

type Filters = {
  search?: string;
  department?: string;
  stage_id?: string;
  owner_id?: string;
};

type Props = {
  stages: { id: string; name: string; colour: string; pipeline_id: string }[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
};

export function ContactFilters({ stages, members, filters, onFilterChange }: Props) {
  const hasFilters = filters.search || filters.department || filters.stage_id || filters.owner_id;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
        <Input
          placeholder="Search contacts..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value || undefined })
          }
          className="pl-9 rounded-xl border-[var(--border-default)] focus:border-[var(--border-emphasis)] focus:ring-2 focus:ring-[var(--accent-secondary)]"
        />
      </div>

      {/* Department */}
      <Select
        value={filters.department ?? "all"}
        onValueChange={(v) =>
          onFilterChange({ ...filters, department: !v || v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[140px] rounded-xl border-[var(--border-default)]">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Depts</SelectItem>
          {DEPARTMENT_OWNERS.map((d) => (
            <SelectItem key={d} value={d}>
              {DEPARTMENT_OWNER_LABELS[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stage */}
      <Select
        value={filters.stage_id ?? "all"}
        onValueChange={(v) =>
          onFilterChange({ ...filters, stage_id: !v || v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[150px] rounded-xl border-[var(--border-default)]">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          {stages.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: s.colour }}
                />
                {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Owner */}
      <Select
        value={filters.owner_id ?? "all"}
        onValueChange={(v) =>
          onFilterChange({ ...filters, owner_id: !v || v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[150px] rounded-xl border-[var(--border-default)]">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Owners</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.full_name ?? "Unknown"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => onFilterChange({})}
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] px-2"
        >
          <X className="size-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
