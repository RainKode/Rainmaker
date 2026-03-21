"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";

export async function getWorkspaces(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .order("is_default", { ascending: false });
  return data ?? [];
}

export async function createWorkspace(
  orgId: string,
  name: string
): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("workspaces").insert({
    name,
    organisation_id: orgId,
    is_default: false,
  });

  if (error) return { error: error.message };
  return { success: "Workspace created" };
}

export async function updateWorkspace(
  workspaceId: string,
  name: string
): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId);

  if (error) return { error: error.message };
  return { success: "Workspace updated" };
}

export async function deleteWorkspace(
  workspaceId: string
): Promise<AuthActionState> {
  const supabase = await createClient();

  // Prevent deleting the default workspace
  const { data: ws } = await supabase
    .from("workspaces")
    .select("is_default")
    .eq("id", workspaceId)
    .single();

  if (ws?.is_default) {
    return { error: "Cannot delete the default workspace" };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ is_active: false })
    .eq("id", workspaceId);

  if (error) return { error: error.message };
  return { success: "Workspace deleted" };
}
