import { z } from "zod/v4";

// ─── Company Schemas ────────────────────────────────────────────────────────

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  domain: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// ─── Contact Schemas ────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  company_id: z.string().uuid().optional(),
  pipeline_id: z.string().uuid().optional(),
  pipeline_stage_id: z.string().uuid().optional(),
  deal_value: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .optional(),
  owner_id: z.string().uuid().optional(),
  lead_source: z.string().max(100).optional(),
  department_owner: z.enum(["leads", "outreach", "closers"]).optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ─── Pipeline Schemas ───────────────────────────────────────────────────────

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required").max(200),
  description: z.string().max(2000).optional(),
  is_default: z.boolean().optional(),
});
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

export const updatePipelineSchema = createPipelineSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;

// ─── Pipeline Stage Schemas ──────────────────────────────────────────────────

export const createPipelineStageSchema = z.object({
  pipeline_id: z.string().uuid(),
  name: z.string().min(1, "Stage name is required").max(100),
  colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex colour")
    .optional(),
  position: z.number().int().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  entry_conditions: z.record(z.string(), z.unknown()).optional(),
  exit_conditions: z.record(z.string(), z.unknown()).optional(),
  department_owner: z.enum(["leads", "outreach", "closers"]).optional(),
  project_template_id: z.string().uuid().optional(),
  sort_order: z.number().int().optional(),
});
export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;

export const updatePipelineStageSchema = createPipelineStageSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;

// ─── Deal Schemas ───────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  total: z.number().min(0),
});

export const createDealSchema = z.object({
  name: z.string().min(1, "Deal name is required").max(200),
  contact_id: z.string().uuid().optional(),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid().optional(),
  value: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .optional(),
  currency: z.string().length(3).optional(),
  expected_close_date: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  line_items: z.array(lineItemSchema).optional(),
  payment_terms: z.string().max(500).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});
export type CreateDealInput = z.infer<typeof createDealSchema>;

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid(),
  loss_reason: z.string().max(1000).optional(),
  won_at: z.string().optional(),
  lost_at: z.string().optional(),
});
export type UpdateDealInput = z.infer<typeof updateDealSchema>;

export const reorderDealsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int(),
    stage_id: z.string().uuid().optional(),
  })
);

// ─── Contact Comment Schemas ────────────────────────────────────────────────

export const createContactCommentSchema = z.object({
  contact_id: z.string().uuid(),
  body: z.string().min(1, "Comment cannot be empty").max(5000),
  mentions: z.array(z.string().uuid()).optional(),
});
export type CreateContactCommentInput = z.infer<typeof createContactCommentSchema>;

// ─── Lead Folder Schemas ────────────────────────────────────────────────────

export const createLeadFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(200),
  description: z.string().max(2000).optional(),
  contact_ids: z.array(z.string().uuid()).min(1, "Select at least one contact"),
  from_department: z.enum(["leads", "outreach", "closers"]),
  to_department: z.enum(["leads", "outreach", "closers"]),
  notes: z.string().max(5000).optional(),
});
export type CreateLeadFolderInput = z.infer<typeof createLeadFolderSchema>;

export const updateLeadFolderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  notes: z.string().max(5000).optional(),
});
export type UpdateLeadFolderInput = z.infer<typeof updateLeadFolderSchema>;

// ─── Message Schemas (Unipile) ──────────────────────────────────────────────

export const incomingMessageSchema = z.object({
  unipile_chat_id: z.string().optional(),
  unipile_message_id: z.string(),
  channel: z.enum([
    "whatsapp",
    "email",
    "linkedin",
    "instagram",
    "telegram",
    "messenger",
  ]),
  sender_identifier: z.string(),
  sender_name: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  body_html: z.string().optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
  thread_id: z.string().optional(),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  timestamp: z.string().optional(),
});
export type IncomingMessageInput = z.infer<typeof incomingMessageSchema>;

export const sendMessageSchema = z.object({
  contact_id: z.string().uuid(),
  channel: z.enum([
    "whatsapp",
    "email",
    "linkedin",
    "instagram",
    "telegram",
    "messenger",
  ]),
  body: z.string().min(1, "Message cannot be empty").max(10000),
  subject: z.string().max(500).optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
  unipile_chat_id: z.string().optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
