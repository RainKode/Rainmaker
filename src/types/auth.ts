// ─── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = ["owner", "admin", "manager", "member", "guest"] as const;
export type Role = (typeof ROLES)[number];

// ─── Organisation ───────────────────────────────────────────────────────────
export type Organisation = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  default_currency: string;
  fiscal_year_start_month: number;
  timezone: string;
  settings: Record<string, unknown>;
  subscription_plan: "free" | "starter" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
};

// ─── Workspace ──────────────────────────────────────────────────────────────
export type Workspace = {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Organisation Membership ────────────────────────────────────────────────
export type OrganisationMembership = {
  id: string;
  user_id: string;
  organisation_id: string;
  role: Role;
  department: string | null;
  hourly_rate: number | null;
  salary_cost_monthly: number | null;
  available_hours_weekly: number;
  joined_at: string;
  is_active: boolean;
};

// ─── Invitation ─────────────────────────────────────────────────────────────
export type Invitation = {
  id: string;
  email: string;
  organisation_id: string;
  role: Role;
  invited_by: string;
  token: string;
  expires_at: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
};

// ─── Profile ────────────────────────────────────────────────────────────────
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  theme: "light" | "dark" | "system";
  date_format: string;
  notification_prefs: Record<string, unknown>;
  last_login_at: string | null;
  status: "active" | "suspended" | "invited";
  created_at: string;
  updated_at: string;
};

// ─── Permission ─────────────────────────────────────────────────────────────
export const PERMISSIONS = [
  // Task
  "task.create",
  "task.edit_own",
  "task.edit_any",
  "task.delete",
  "task.assign",
  "task.view_all",
  // Project
  "project.create",
  "project.edit",
  "project.delete",
  "project.archive",
  // CRM
  "crm.contact.create",
  "crm.contact.edit",
  "crm.contact.delete",
  "crm.deal.create",
  "crm.deal.edit",
  "crm.pipeline.manage",
  "crm.inbox.access",
  // ERP
  "erp.journal.create",
  "erp.journal.view",
  "erp.invoice.create",
  "erp.invoice.edit",
  "erp.expense.submit",
  "erp.expense.approve",
  "erp.reports.view",
  "erp.asset.manage",
  // Organisation
  "org.settings",
  "org.manage_users",
  "org.manage_billing",
  "org.delete",
  // Workspace
  "workspace.create",
  "workspace.edit",
  // Automation
  "automation.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
