"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
} from "@/lib/validations/task";

export type ActionState = {
  error?: string;
  success?: string;
};

export async function createTimeEntry(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createTimeEntrySchema.safeParse(raw);

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

  const { error } = await supabase.from("time_entries").insert({
    organisation_id: membership.organisation_id,
    task_id: parsed.data.task_id,
    user_id: user.id,
    start_time: parsed.data.start_time || null,
    end_time: parsed.data.end_time || null,
    duration_minutes: parsed.data.duration_minutes,
    hourly_rate: parsed.data.hourly_rate || null,
    billable: parsed.data.billable || false,
    source: parsed.data.source || "manual",
    notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };
  return { success: "Time entry created" };
}

export async function stopTimer(
  taskId: string,
  startTime: string,
  durationMinutes: number
): Promise<ActionState> {
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

  const roundedMinutes = Math.max(1, Math.round(durationMinutes));

  const { error } = await supabase.from("time_entries").insert({
    organisation_id: membership.organisation_id,
    task_id: taskId,
    user_id: user.id,
    start_time: startTime,
    end_time: new Date().toISOString(),
    duration_minutes: roundedMinutes,
    source: "timer",
  });

  if (error) return { error: error.message };
  return { success: "Timer stopped, time entry saved" };
}

export async function updateTimeEntry(
  data: Record<string, unknown>
): Promise<ActionState> {
  const parsed = updateTimeEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, ...updates } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("time_entries")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Time entry updated" };
}

export async function deleteTimeEntry(id: string): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.from("time_entries").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: "Time entry deleted" };
}
