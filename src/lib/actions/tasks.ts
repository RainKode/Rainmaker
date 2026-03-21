"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  reorderTasksSchema,
} from "@/lib/validations/task";

export type ActionState = {
  error?: string;
  success?: string;
  data?: unknown;
};

export async function createTask(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);

  // Parse JSON fields that come as strings from FormData
  const data: Record<string, unknown> = { ...raw };
  if (typeof raw.tags === "string") {
    try { data.tags = JSON.parse(raw.tags as string); } catch { data.tags = []; }
  }
  if (typeof raw.checklist === "string") {
    try { data.checklist = JSON.parse(raw.checklist as string); } catch { data.checklist = []; }
  }
  if (typeof raw.watchers === "string") {
    try { data.watchers = JSON.parse(raw.watchers as string); } catch { data.watchers = []; }
  }
  if (typeof raw.description === "string" && raw.description) {
    try { data.description = JSON.parse(raw.description as string); } catch { /* keep as string */ }
  }

  const parsed = createTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) return { error: "No organisation found" };

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      organisation_id: membership.organisation_id,
      project_id: parsed.data.project_id || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status || "created",
      assignee_id: parsed.data.assignee_id || null,
      reporter_id: user.id,
      priority: parsed.data.priority || "medium",
      task_type: parsed.data.task_type || "other",
      start_date: parsed.data.start_date || null,
      due_date: parsed.data.due_date || null,
      time_estimate_minutes: parsed.data.time_estimate_minutes || null,
      billable: parsed.data.billable || false,
      parent_task_id: parsed.data.parent_task_id || null,
      tags: parsed.data.tags || [],
      checklist: parsed.data.checklist || [],
      watchers: parsed.data.watchers || [],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Task created", data: task };
}

export async function updateTask(data: {
  id: string;
  [key: string]: unknown;
}): Promise<ActionState> {
  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, ...updates } = parsed.data;
  const supabase = await createClient();

  // If status changed to completed, set completed_at
  if (updates.status === "completed") {
    (updates as Record<string, unknown>).completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("tasks").update(updates).eq("id", id);

  if (error) return { error: error.message };
  return { success: "Task updated" };
}

export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<ActionState> {
  const parsed = updateTaskStatusSchema.safeParse({ id: taskId, status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const updateData: Record<string, unknown> = { status: parsed.data.status };

  if (parsed.data.status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  return { success: "Status updated" };
}

export async function reorderTasks(
  updates: { id: string; sort_order: number; status?: string }[]
): Promise<ActionState> {
  const parsed = reorderTasksSchema.safeParse(updates);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Batch update sort orders
  for (const item of parsed.data) {
    const updateData: Record<string, unknown> = { sort_order: item.sort_order };
    if (item.status) updateData.status = item.status;

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", item.id);

    if (error) return { error: error.message };
  }

  return { success: "Tasks reordered" };
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ is_active: false })
    .eq("id", taskId);

  if (error) return { error: error.message };
  return { success: "Task deleted" };
}
