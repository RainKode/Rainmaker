"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/task";

export type ActionState = {
  error?: string;
  success?: string;
};

export async function createProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createProjectSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Get user's current org
  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) return { error: "No organisation found" };

  const { error } = await supabase.from("projects").insert({
    organisation_id: membership.organisation_id,
    workspace_id: parsed.data.workspace_id || null,
    name: parsed.data.name,
    description: parsed.data.description || null,
    status: parsed.data.status || "active",
    owner_id: user.id,
    start_date: parsed.data.start_date || null,
    target_end_date: parsed.data.target_end_date || null,
    default_billable: parsed.data.default_billable || false,
    default_hourly_rate: parsed.data.default_hourly_rate || null,
  });

  if (error) return { error: error.message };
  return { success: "Project created" };
}

export async function updateProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = updateProjectSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, ...updates } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Project updated" };
}

export async function archiveProject(projectId: string): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ is_active: false, status: "archived" })
    .eq("id", projectId);

  if (error) return { error: error.message };
  return { success: "Project archived" };
}
