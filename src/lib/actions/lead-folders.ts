"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createLeadFolderSchema,
  updateLeadFolderSchema,
} from "@/lib/validations/crm";

export type ActionState = {
  error?: string;
  success?: string;
  data?: unknown;
};

async function getOrgContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, supabase, user: null, orgId: null };

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership)
    return { error: "No organisation found" as const, supabase, user, orgId: null };

  return { error: null, supabase, user, orgId: membership.organisation_id };
}

export async function createLeadFolder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const data: Record<string, unknown> = { ...raw };

  if (typeof raw.contact_ids === "string") {
    try { data.contact_ids = JSON.parse(raw.contact_ids as string); } catch { data.contact_ids = []; }
  }

  const parsed = createLeadFolderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: folder, error } = await ctx.supabase
    .from("lead_folders")
    .insert({
      organisation_id: ctx.orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      contact_ids: parsed.data.contact_ids,
      from_department: parsed.data.from_department,
      to_department: parsed.data.to_department,
      submitted_by: ctx.user!.id,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Lead folder submitted", data: folder };
}

export async function updateLeadFolderStatus(data: {
  id: string;
  status?: string;
  notes?: string;
}): Promise<ActionState> {
  const parsed = updateLeadFolderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...updates } = parsed.data;
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("lead_folders")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Lead folder updated" };
}

export async function acceptLeadFolder(folderId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  // Get folder details
  const { data: folder, error: fetchError } = await ctx.supabase
    .from("lead_folders")
    .select("*")
    .eq("id", folderId)
    .single();

  if (fetchError || !folder) return { error: fetchError?.message || "Folder not found" };

  // Update folder status
  const { error: updateError } = await ctx.supabase
    .from("lead_folders")
    .update({ status: "in_progress" })
    .eq("id", folderId);

  if (updateError) return { error: updateError.message };

  // Update contacts' department_owner to the target department
  const contactIds = (folder as Record<string, unknown>).contact_ids as string[];
  if (contactIds && contactIds.length > 0) {
    const toDept = (folder as Record<string, unknown>).to_department as string;
    const { error: contactError } = await ctx.supabase
      .from("contacts")
      .update({ department_owner: toDept })
      .in("id", contactIds);

    if (contactError) return { error: contactError.message };
  }

  return { success: "Lead folder accepted" };
}

export async function getLeadFolders(filters?: {
  status?: string;
}): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  let query = ctx.supabase
    .from("lead_folders")
    .select("*, submitter:profiles!lead_folders_submitted_by_fkey(full_name, avatar_url)")
    .eq("organisation_id", ctx.orgId)
    .order("submitted_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: "Lead folders fetched", data };
}
