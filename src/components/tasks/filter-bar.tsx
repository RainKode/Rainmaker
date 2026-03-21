"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  TASK_PRIORITIES,
  PRIORITY_LABELS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
} from "@/types/task";

type FilterBarProps = {
  assigneeFilter: string;
  onAssigneeChange: (value: string | null) => void;
  priorityFilter: string;
  onPriorityChange: (value: string | null) => void;
  typeFilter: string;
  onTypeChange: (value: string | null) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  members?: { id: string; full_name: string | null }[];
};

export function FilterBar({
  assigneeFilter,
  onAssigneeChange,
  priorityFilter,
  onPriorityChange,
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  onClear,
  members = [],
}: FilterBarProps) {
  const hasFilters =
    assigneeFilter !== "all" ||
    priorityFilter !== "all" ||
    typeFilter !== "all" ||
    searchQuery !== "";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-[200px] rounded-xl"
      />

      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-[150px] rounded-xl">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.full_name ?? m.id.slice(0, 8)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[130px] rounded-xl">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[130px] rounded-xl">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {TASK_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {TASK_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-1 rounded-full"
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
