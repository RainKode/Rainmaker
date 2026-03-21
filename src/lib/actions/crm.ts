"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createCompanySchema,
  updateCompanySchema,
  createContactSchema,
  updateContactSchema,
  createDealSchema,
  updateDealSchema,
  reorderDealsSchema,
  createPipelineSchema,
  updatePipelineSchema,
  createPipelineStageSchema,
  updatePipelineStageSchema,
  createContactCommentSchema,
} from "@/lib/validations/crm";

export type ActionState = {
  error?: string;
  success?: string;
  data?: unknown;
};

// ─── Helper: get org membership ─────────────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════════════
// Companies
// ═══════════════════════════════════════════════════════════════════════════

export async function createCompany(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const data: Record<string, unknown> = { ...raw };

  if (typeof raw.address === "string" && raw.address) {
    try { data.address = JSON.parse(raw.address as string); } catch { data.address = {}; }
  }
  if (typeof raw.custom_fields === "string" && raw.custom_fields) {
    try { data.custom_fields = JSON.parse(raw.custom_fields as string); } catch { data.custom_fields = {}; }
  }

  const parsed = createCompanySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: company, error } = await ctx.supabase
    .from("companies")
    .insert({
      organisation_id: ctx.orgId,
      ...parsed.data,
      address: parsed.data.address || {},
      custom_fields: parsed.data.custom_fields || {},
      website: parsed.data.website || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Company created", data: company };
}

export async function updateCompany(data: {
  id: string;
  [key: string]: unknown;
}): Promise<ActionState> {
  const parsed = updateCompanySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...updates } = parsed.data;
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("companies")
    .update({ ...updates, website: updates.website || null })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Company updated" };
}

export async function deleteCompany(companyId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("companies")
    .update({ is_active: false })
    .eq("id", companyId);

  if (error) return { error: error.message };
  return { success: "Company deleted" };
}

// ═══════════════════════════════════════════════════════════════════════════
// Contacts
// ═══════════════════════════════════════════════════════════════════════════

export async function createContact(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const data: Record<string, unknown> = { ...raw };

  if (typeof raw.tags === "string") {
    try { data.tags = JSON.parse(raw.tags as string); } catch { data.tags = []; }
  }
  if (typeof raw.custom_fields === "string" && raw.custom_fields) {
    try { data.custom_fields = JSON.parse(raw.custom_fields as string); } catch { data.custom_fields = {}; }
  }

  const parsed = createContactSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: contact, error } = await ctx.supabase
    .from("contacts")
    .insert({
      organisation_id: ctx.orgId,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company_id: parsed.data.company_id || null,
      pipeline_id: parsed.data.pipeline_id || null,
      pipeline_stage_id: parsed.data.pipeline_stage_id || null,
      deal_value: parsed.data.deal_value ?? null,
      owner_id: parsed.data.owner_id || null,
      lead_source: parsed.data.lead_source || null,
      department_owner: parsed.data.department_owner || null,
      tags: parsed.data.tags || [],
      custom_fields: parsed.data.custom_fields || {},
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Contact created", data: contact };
}

export async function updateContact(data: {
  id: string;
  [key: string]: unknown;
}): Promise<ActionState> {
  const parsed = updateContactSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...updates } = parsed.data;
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("contacts")
    .update({
      ...updates,
      email: updates.email || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Contact updated" };
}

export async function deleteContact(contactId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("contacts")
    .update({ is_active: false })
    .eq("id", contactId);

  if (error) return { error: error.message };
  return { success: "Contact deleted" };
}

export async function getContacts(filters?: {
  search?: string;
  department?: string;
  stage_id?: string;
  owner_id?: string;
  tags?: string[];
  cursor?: string;
  limit?: number;
}): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const limit = filters?.limit || 50;

  let query = ctx.supabase
    .from("contacts")
    .select(
      `*, company:companies(id, name, domain), pipeline_stage:pipeline_stages(id, name, colour), owner:profiles!contacts_owner_id_fkey(id, full_name, avatar_url)`
    )
    .eq("organisation_id", ctx.orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.department) {
    query = query.eq("department_owner", filters.department);
  }
  if (filters?.stage_id) {
    query = query.eq("pipeline_stage_id", filters.stage_id);
  }
  if (filters?.owner_id) {
    query = query.eq("owner_id", filters.owner_id);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }
  if (filters?.cursor) {
    query = query.lt("created_at", filters.cursor);
  }
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: "Contacts fetched", data };
}

export async function getContact(contactId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("contacts")
    .select(
      `*, company:companies(id, name, domain), pipeline_stage:pipeline_stages(id, name, colour), owner:profiles!contacts_owner_id_fkey(id, full_name, avatar_url)`
    )
    .eq("id", contactId)
    .single();

  if (error) return { error: error.message };
  return { success: "Contact fetched", data };
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipelines
// ═══════════════════════════════════════════════════════════════════════════

export async function createPipeline(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createPipelineSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: pipeline, error } = await ctx.supabase
    .from("pipelines")
    .insert({
      organisation_id: ctx.orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      is_default: parsed.data.is_default || false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Pipeline created", data: pipeline };
}

export async function updatePipeline(data: {
  id: string;
  [key: string]: unknown;
}): Promise<ActionState> {
  const parsed = updatePipelineSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...updates } = parsed.data;
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("pipelines")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Pipeline updated" };
}

export async function getPipelines(): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("pipelines")
    .select("*, stages:pipeline_stages(*, count:deals(count))")
    .eq("organisation_id", ctx.orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { success: "Pipelines fetched", data };
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Stages
// ═══════════════════════════════════════════════════════════════════════════

export async function createPipelineStage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const data: Record<string, unknown> = { ...raw };

  if (typeof raw.position === "string") data.position = Number(raw.position);
  if (typeof raw.probability === "string") data.probability = Number(raw.probability);
  if (typeof raw.sort_order === "string") data.sort_order = Number(raw.sort_order);

  const parsed = createPipelineStageSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: stage, error } = await ctx.supabase
    .from("pipeline_stages")
    .insert({
      pipeline_id: parsed.data.pipeline_id,
      name: parsed.data.name,
      colour: parsed.data.colour || "#7AA6B3",
      position: parsed.data.position ?? 0,
      probability: parsed.data.probability ?? 0,
      entry_conditions: parsed.data.entry_conditions || {},
      exit_conditions: parsed.data.exit_conditions || {},
      department_owner: parsed.data.department_owner || null,
      project_template_id: parsed.data.project_template_id || null,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Stage created", data: stage };
}

export async function updatePipelineStage(data: {
  id: string;
  [key: string]: unknown;
}): Promise<ActionState> {
  const parsed = updatePipelineStageSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...updates } = parsed.data;
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("pipeline_stages")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Stage updated" };
}

export async function reorderStages(
  updates: { id: string; sort_order: number; position: number }[]
): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  for (const item of updates) {
    const { error } = await ctx.supabase
      .from("pipeline_stages")
      .update({ sort_order: item.sort_order, position: item.position })
      .eq("id", item.id);
    if (error) return { error: error.message };
  }

  return { success: "Stages reordered" };
}

// ═══════════════════════════════════════════════════════════════════════════
// Deals
// ═══════════════════════════════════════════════════════════════════════════

export async function createDeal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const data: Record<string, unknown> = { ...raw };

  if (typeof raw.line_items === "string") {
    try { data.line_items = JSON.parse(raw.line_items as string); } catch { data.line_items = []; }
  }
  if (typeof raw.custom_fields === "string" && raw.custom_fields) {
    try { data.custom_fields = JSON.parse(raw.custom_fields as string); } catch { data.custom_fields = {}; }
  }

  const parsed = createDealSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: deal, error } = await ctx.supabase
    .from("deals")
    .insert({
      organisation_id: ctx.orgId,
      name: parsed.data.name,
      contact_id: parsed.data.contact_id || null,
      pipeline_id: parsed.data.pipeline_id,
      stage_id: parsed.data.stage_id || null,
      value: parsed.data.value ?? null,
      currency: parsed.data.currency || "GBP",
      expected_close_date: parsed.data.expected_close_date || null,
      owner_id: parsed.data.owner_id || ctx.user!.id,
      line_items: parsed.data.line_items || [],
      payment_terms: parsed.data.payment_terms || null,
      custom_fields: parsed.data.custom_fields || {},
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Deal created", data: deal };
}

export async function updateDeal(data: {
  id: string;
  [key: string]: unknown;
}): Promise<ActionState> {
  const parsed = updateDealSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...updates } = parsed.data;
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("deals")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Deal updated" };
}

export async function moveDealToStage(
  dealId: string,
  stageId: string
): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("deals")
    .update({ stage_id: stageId })
    .eq("id", dealId);

  if (error) return { error: error.message };
  return { success: "Deal moved" };
}

export async function deleteDeal(dealId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("deals")
    .update({ is_active: false })
    .eq("id", dealId);

  if (error) return { error: error.message };
  return { success: "Deal deleted" };
}

export async function reorderDeals(
  updates: { id: string; sort_order: number; stage_id?: string }[]
): Promise<ActionState> {
  const parsed = reorderDealsSchema.safeParse(updates);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  for (const item of parsed.data) {
    const updateData: Record<string, unknown> = { sort_order: item.sort_order };
    if (item.stage_id) updateData.stage_id = item.stage_id;

    const { error } = await ctx.supabase
      .from("deals")
      .update(updateData)
      .eq("id", item.id);
    if (error) return { error: error.message };
  }

  return { success: "Deals reordered" };
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact Comments
// ═══════════════════════════════════════════════════════════════════════════

export async function createComment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const data: Record<string, unknown> = { ...raw };

  if (typeof raw.mentions === "string") {
    try { data.mentions = JSON.parse(raw.mentions as string); } catch { data.mentions = []; }
  }

  const parsed = createContactCommentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data: comment, error } = await ctx.supabase
    .from("contact_comments")
    .insert({
      contact_id: parsed.data.contact_id,
      user_id: ctx.user!.id,
      body: parsed.data.body,
      mentions: parsed.data.mentions || [],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: "Comment added", data: comment };
}

export async function getComments(contactId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("contact_comments")
    .select("*, user:profiles(full_name, avatar_url)")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { success: "Comments fetched", data };
}

// ═══════════════════════════════════════════════════════════════════════════
// Import Contacts (CSV)
// ═══════════════════════════════════════════════════════════════════════════

export async function importContacts(
  contacts: Array<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    lead_source?: string;
    tags?: string[];
  }>
): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of contacts) {
    // Basic validation
    if (!row.first_name || !row.last_name) {
      skipped++;
      continue;
    }

    // Duplicate check by email
    if (row.email) {
      const { data: existing } = await ctx.supabase
        .from("contacts")
        .select("id")
        .eq("organisation_id", ctx.orgId)
        .eq("email", row.email)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (existing) {
        skipped++;
        continue;
      }
    }

    const { error } = await ctx.supabase.from("contacts").insert({
      organisation_id: ctx.orgId,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email || null,
      phone: row.phone || null,
      lead_source: row.lead_source || "csv_import",
      tags: row.tags || [],
    });

    if (error) {
      errors.push(`${row.first_name} ${row.last_name}: ${error.message}`);
    } else {
      imported++;
    }
  }

  return {
    success: `Imported ${imported} contacts, skipped ${skipped} duplicates`,
    data: { imported, skipped, errors },
  };
}
