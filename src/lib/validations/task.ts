import { z } from "zod/v4";

// ─── Project Schemas ────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  description: z.string().max(2000).optional(),
  workspace_id: z.string().uuid().optional(),
  status: z.enum(["active", "completed", "archived", "on_hold"]).optional(),
  start_date: z.string().optional(),
  target_end_date: z.string().optional(),
  default_billable: z
    .union([z.boolean(), z.literal("on"), z.literal("off")])
    .transform((v) => v === true || v === "on")
    .optional(),
  default_hourly_rate: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ─── Task Schemas ───────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.unknown().optional(),
  project_id: z.string().uuid().optional(),
  status: z
    .enum([
      "created",
      "assigned",
      "in_progress",
      "in_review",
      "completed",
      "blocked",
      "on_hold",
      "closed",
    ])
    .optional(),
  assignee_id: z.string().uuid().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  task_type: z
    .enum(["bug", "feature", "admin", "meeting", "support", "other"])
    .optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  time_estimate_minutes: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .optional(),
  billable: z
    .union([z.boolean(), z.literal("on"), z.literal("off")])
    .transform((v) => v === true || v === "on")
    .optional(),
  parent_task_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean(),
      })
    )
    .optional(),
  watchers: z.array(z.string().uuid()).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "created",
    "assigned",
    "in_progress",
    "in_review",
    "completed",
    "blocked",
    "on_hold",
    "closed",
  ]),
});

export const reorderTasksSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int(),
    status: z
      .enum([
        "created",
        "assigned",
        "in_progress",
        "in_review",
        "completed",
        "blocked",
        "on_hold",
        "closed",
      ])
      .optional(),
  })
);

// ─── Time Entry Schemas ─────────────────────────────────────────────────────

export const createTimeEntrySchema = z.object({
  task_id: z.string().uuid(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_minutes: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().positive("Duration must be positive")),
  hourly_rate: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .optional(),
  billable: z
    .union([z.boolean(), z.literal("on"), z.literal("off")])
    .transform((v) => v === true || v === "on")
    .optional(),
  source: z.enum(["timer", "manual", "timesheet"]).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

export const updateTimeEntrySchema = createTimeEntrySchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
