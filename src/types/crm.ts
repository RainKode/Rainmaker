// ─── Company Sizes ──────────────────────────────────────────────────────────
export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  "1-10": "1–10 employees",
  "11-50": "11–50 employees",
  "51-200": "51–200 employees",
  "201-500": "201–500 employees",
  "500+": "500+ employees",
};

// ─── Channels ───────────────────────────────────────────────────────────────
export const CHANNELS = [
  "whatsapp",
  "email",
  "linkedin",
  "instagram",
  "telegram",
  "messenger",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  telegram: "Telegram",
  messenger: "Messenger",
};

// ─── Message Directions ─────────────────────────────────────────────────────
export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_DIRECTION_LABELS: Record<MessageDirection, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

// ─── Department Owners ──────────────────────────────────────────────────────
export const DEPARTMENT_OWNERS = ["leads", "outreach", "closers"] as const;
export type DepartmentOwner = (typeof DEPARTMENT_OWNERS)[number];

export const DEPARTMENT_OWNER_LABELS: Record<DepartmentOwner, string> = {
  leads: "Leads",
  outreach: "Outreach",
  closers: "Closers",
};

// ─── Lead Folder Statuses ───────────────────────────────────────────────────
export const LEAD_FOLDER_STATUSES = [
  "pending",
  "in_progress",
  "completed",
] as const;
export type LeadFolderStatus = (typeof LEAD_FOLDER_STATUSES)[number];

export const LEAD_FOLDER_STATUS_LABELS: Record<LeadFolderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

// ─── Company ────────────────────────────────────────────────────────────────
export type Company = {
  id: string;
  organisation_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: CompanySize | null;
  address: Record<string, unknown>;
  phone: string | null;
  website: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Pipeline ───────────────────────────────────────────────────────────────
export type Pipeline = {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Pipeline Stage ─────────────────────────────────────────────────────────
export type PipelineStage = {
  id: string;
  pipeline_id: string;
  name: string;
  colour: string;
  position: number;
  probability: number;
  entry_conditions: Record<string, unknown>;
  exit_conditions: Record<string, unknown>;
  department_owner: DepartmentOwner | null;
  project_template_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Contact ────────────────────────────────────────────────────────────────
export type Contact = {
  id: string;
  organisation_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  pipeline_id: string | null;
  pipeline_stage_id: string | null;
  deal_value: number | null;
  owner_id: string | null;
  lead_source: string | null;
  lead_score: number;
  department_owner: DepartmentOwner | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  last_contact_date: string | null;
  total_hours_spent: number;
  total_billable_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Contact with company join
export type ContactWithCompany = Contact & {
  company: Pick<Company, "id" | "name" | "domain"> | null;
};

// Contact with full relations
export type ContactWithDetails = Contact & {
  company: Pick<Company, "id" | "name" | "domain"> | null;
  pipeline_stage: Pick<PipelineStage, "id" | "name" | "colour"> | null;
  owner: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

// ─── Deal ───────────────────────────────────────────────────────────────────
export type DealLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type Deal = {
  id: string;
  organisation_id: string;
  contact_id: string | null;
  pipeline_id: string;
  stage_id: string | null;
  name: string;
  value: number | null;
  currency: string;
  expected_close_date: string | null;
  owner_id: string | null;
  loss_reason: string | null;
  won_at: string | null;
  lost_at: string | null;
  line_items: DealLineItem[];
  payment_terms: string | null;
  custom_fields: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Deal with contact join
export type DealWithContact = Deal & {
  contact: Pick<Contact, "id" | "first_name" | "last_name" | "email"> | null;
};

// Minimal data for Kanban deal cards
export type DealCardData = Pick<
  Deal,
  | "id"
  | "name"
  | "value"
  | "currency"
  | "expected_close_date"
  | "sort_order"
  | "stage_id"
  | "owner_id"
> & {
  contact: Pick<Contact, "id" | "first_name" | "last_name"> | null;
  owner: { full_name: string | null; avatar_url: string | null } | null;
  stage: Pick<PipelineStage, "name" | "colour"> | null;
};

// ─── Message ────────────────────────────────────────────────────────────────
export type Message = {
  id: string;
  organisation_id: string;
  contact_id: string | null;
  unipile_chat_id: string | null;
  unipile_message_id: string | null;
  channel: Channel;
  direction: MessageDirection;
  sender_identifier: string | null;
  sender_name: string | null;
  subject: string | null;
  body: string | null;
  body_html: string | null;
  attachments: Record<string, unknown>[];
  thread_id: string | null;
  cc: string[];
  bcc: string[];
  sent_by_user_id: string | null;
  read: boolean;
  timestamp: string;
  created_at: string;
};

// Grouped by contact for conversation list
export type MessageThread = {
  contact_id: string | null;
  contact: Pick<Contact, "id" | "first_name" | "last_name" | "email"> | null;
  last_message: Message;
  unread_count: number;
  channel: Channel;
};

// ─── Contact Comment ────────────────────────────────────────────────────────
export type ContactComment = {
  id: string;
  contact_id: string;
  user_id: string;
  body: string;
  mentions: string[];
  created_at: string;
  user?: { full_name: string | null; avatar_url: string | null };
};

// ─── Lead Folder ────────────────────────────────────────────────────────────
export type LeadFolder = {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  contact_ids: string[];
  from_department: DepartmentOwner;
  to_department: DepartmentOwner;
  submitted_by: string | null;
  status: LeadFolderStatus;
  notes: string | null;
  submitted_at: string;
};
