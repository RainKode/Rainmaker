// ─── Task Statuses ──────────────────────────────────────────────────────────
export const TASK_STATUSES = [
  "created",
  "assigned",
  "in_progress",
  "in_review",
  "completed",
  "blocked",
  "on_hold",
  "closed",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Kanban-visible statuses (subset used on the board)
export const KANBAN_STATUSES: TaskStatus[] = [
  "created",
  "assigned",
  "in_progress",
  "in_review",
  "completed",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  created: "Created",
  assigned: "Assigned",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
  blocked: "Blocked",
  on_hold: "On Hold",
  closed: "Closed",
};

// ─── Priorities ─────────────────────────────────────────────────────────────
export const TASK_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ─── Task Types ─────────────────────────────────────────────────────────────
export const TASK_TYPES = [
  "bug",
  "feature",
  "admin",
  "meeting",
  "support",
  "other",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  bug: "Bug",
  feature: "Feature",
  admin: "Admin",
  meeting: "Meeting",
  support: "Support",
  other: "Other",
};

// ─── Project Statuses ───────────────────────────────────────────────────────
export const PROJECT_STATUSES = [
  "active",
  "completed",
  "archived",
  "on_hold",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ─── Dependency Types ───────────────────────────────────────────────────────
export const DEPENDENCY_TYPES = [
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
  "start_to_finish",
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

// ─── Checklist Item ─────────────────────────────────────────────────────────
export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

// ─── Project ────────────────────────────────────────────────────────────────
export type Project = {
  id: string;
  organisation_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  client_contact_id: string | null;
  deal_id: string | null;
  start_date: string | null;
  target_end_date: string | null;
  default_billable: boolean;
  default_hourly_rate: number | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Task ───────────────────────────────────────────────────────────────────
export type Task = {
  id: string;
  organisation_id: string;
  project_id: string | null;
  title: string;
  description: unknown | null; // TipTap JSON
  status: TaskStatus;
  assignee_id: string | null;
  reporter_id: string;
  priority: TaskPriority;
  task_type: TaskType;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  time_estimate_minutes: number | null;
  billable: boolean;
  parent_task_id: string | null;
  tags: string[];
  checklist: ChecklistItem[];
  watchers: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Task with relations (for display) ──────────────────────────────────────
export type TaskWithProject = Task & {
  project: Pick<Project, "id" | "name"> | null;
  assignee: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

// Minimal data for Kanban cards
export type TaskCardData = Pick<
  Task,
  | "id"
  | "title"
  | "status"
  | "priority"
  | "due_date"
  | "checklist"
  | "sort_order"
  | "assignee_id"
> & {
  assignee: { full_name: string | null; avatar_url: string | null } | null;
};

// ─── Time Entry ─────────────────────────────────────────────────────────────
export type TimeEntry = {
  id: string;
  organisation_id: string;
  task_id: string;
  user_id: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  hourly_rate: number | null;
  billable: boolean;
  source: "timer" | "manual" | "timesheet";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Task Dependency ────────────────────────────────────────────────────────
export type TaskDependency = {
  id: string;
  organisation_id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: DependencyType;
  created_at: string;
};

// ─── Notification ───────────────────────────────────────────────────────────
export type Notification = {
  id: string;
  organisation_id: string;
  user_id: string;
  event_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
};
