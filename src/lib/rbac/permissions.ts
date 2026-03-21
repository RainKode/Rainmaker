import type { Permission, Role } from "@/types/auth";

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  owner: new Set([
    "task.create", "task.edit_own", "task.edit_any", "task.delete", "task.assign", "task.view_all",
    "project.create", "project.edit", "project.delete", "project.archive",
    "crm.contact.create", "crm.contact.edit", "crm.contact.delete",
    "crm.deal.create", "crm.deal.edit", "crm.pipeline.manage", "crm.inbox.access",
    "erp.journal.create", "erp.journal.view", "erp.invoice.create", "erp.invoice.edit",
    "erp.expense.submit", "erp.expense.approve", "erp.reports.view", "erp.asset.manage",
    "org.settings", "org.manage_users", "org.manage_billing", "org.delete",
    "workspace.create", "workspace.edit",
    "automation.manage",
  ]),
  admin: new Set([
    "task.create", "task.edit_own", "task.edit_any", "task.delete", "task.assign", "task.view_all",
    "project.create", "project.edit", "project.delete", "project.archive",
    "crm.contact.create", "crm.contact.edit", "crm.contact.delete",
    "crm.deal.create", "crm.deal.edit", "crm.pipeline.manage", "crm.inbox.access",
    "erp.journal.create", "erp.journal.view", "erp.invoice.create", "erp.invoice.edit",
    "erp.expense.submit", "erp.expense.approve", "erp.reports.view", "erp.asset.manage",
    "org.settings", "org.manage_users",
    "workspace.create", "workspace.edit",
    "automation.manage",
  ]),
  manager: new Set([
    "task.create", "task.edit_own", "task.edit_any", "task.assign", "task.view_all",
    "project.create", "project.edit", "project.archive",
    "crm.contact.create", "crm.contact.edit",
    "crm.deal.create", "crm.deal.edit", "crm.pipeline.manage", "crm.inbox.access",
    "erp.expense.submit", "erp.expense.approve", "erp.reports.view",
    "automation.manage",
  ]),
  member: new Set([
    "task.create", "task.edit_own",
    "crm.contact.create", "crm.contact.edit",
    "crm.deal.create", "crm.deal.edit", "crm.inbox.access",
    "erp.expense.submit",
  ]),
  guest: new Set<Permission>([]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function getPermissionsForRole(role: Role): Set<Permission> {
  return ROLE_PERMISSIONS[role] ?? new Set();
}
