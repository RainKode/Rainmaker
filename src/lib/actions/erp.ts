"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createAccountSchema,
  updateAccountSchema,
  createPeriodSchema,
  updatePeriodStatusSchema,
  createCostCentreSchema,
  createJournalEntrySchema,
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  createPaymentSchema,
  createExpenseSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
} from "@/lib/validations/erp";

export type ActionState = {
  error?: string;
  success?: string;
  data?: unknown;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOrgContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) return null;
  return { supabase, user, orgId: membership.organisation_id, role: membership.role };
}

// ─── Chart of Accounts ──────────────────────────────────────────────────────

export async function createAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createAccountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const { supabase, orgId } = ctx;

  // Derive normal_balance from account_type if not provided
  const normalBalance =
    parsed.data.normal_balance ??
    (["asset", "expense"].includes(parsed.data.account_type) ? "debit" : "credit");

  const { error } = await supabase.from("chart_of_accounts").insert({
    organisation_id: orgId,
    parent_id: parsed.data.parent_id || null,
    code: parsed.data.code,
    name: parsed.data.name,
    account_type: parsed.data.account_type,
    sub_type: parsed.data.sub_type || null,
    currency: parsed.data.currency || "GBP",
    description: parsed.data.description || null,
    normal_balance: normalBalance,
  });

  if (error) return { error: error.message };
  return { success: "Account created" };
}

export async function updateAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = updateAccountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const { id, ...updates } = parsed.data;
  const { error } = await ctx.supabase
    .from("chart_of_accounts")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: "Account updated" };
}

export async function toggleAccount(accountId: string, isActive: boolean): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const { error } = await ctx.supabase
    .from("chart_of_accounts")
    .update({ is_active: isActive })
    .eq("id", accountId);

  if (error) return { error: error.message };
  return { success: isActive ? "Account activated" : "Account deactivated" };
}

// ─── Accounting Periods ─────────────────────────────────────────────────────

export async function createPeriod(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createPeriodSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const { error } = await ctx.supabase.from("accounting_periods").insert({
    organisation_id: ctx.orgId,
    name: parsed.data.name,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
  });

  if (error) return { error: error.message };
  return { success: "Period created" };
}

export async function updatePeriodStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = updatePeriodStatusSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "closed" || parsed.data.status === "locked") {
    updateData.closed_by = ctx.user.id;
    updateData.closed_at = new Date().toISOString();
  }

  const { error } = await ctx.supabase
    .from("accounting_periods")
    .update(updateData)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  return { success: `Period ${parsed.data.status}` };
}

// ─── Cost Centres ───────────────────────────────────────────────────────────

export async function createCostCentre(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createCostCentreSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const { error } = await ctx.supabase.from("cost_centres").insert({
    organisation_id: ctx.orgId,
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
    manager_id: parsed.data.manager_id || null,
  });

  if (error) return { error: error.message };
  return { success: "Cost centre created" };
}

// ─── Journal Entries ────────────────────────────────────────────────────────

export async function createJournalEntry(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);

  // Parse the lines JSON string
  let lines: unknown[] = [];
  if (typeof raw.lines === "string") {
    try {
      lines = JSON.parse(raw.lines);
    } catch {
      return { error: "Invalid journal lines data" };
    }
  }

  const parsed = createJournalEntrySchema.safeParse({
    ...raw,
    lines,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Validate balance client-side too
  const totalDebit = parsed.data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = parsed.data.lines.reduce((sum, l) => sum + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return { error: `Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)})` };
  }

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  // Insert journal entry
  const { data: entry, error: entryError } = await ctx.supabase
    .from("journal_entries")
    .insert({
      organisation_id: ctx.orgId,
      period_id: parsed.data.period_id,
      entry_date: parsed.data.entry_date,
      reference: parsed.data.reference || null,
      description: parsed.data.description,
      source: "manual",
      posted_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (entryError) return { error: entryError.message };

  // Insert lines
  const lineInserts = parsed.data.lines.map((line, i) => ({
    journal_entry_id: entry.id,
    account_id: line.account_id,
    cost_centre_id: line.cost_centre_id || null,
    description: line.description || null,
    debit: line.debit,
    credit: line.credit,
  }));

  const { error: linesError } = await ctx.supabase
    .from("journal_entry_lines")
    .insert(lineInserts);

  if (linesError) return { error: linesError.message };
  return { success: "Journal entry created", data: { id: entry.id } };
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export async function createInvoice(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);

  let lineItems: unknown[] = [];
  if (typeof raw.line_items === "string") {
    try {
      lineItems = JSON.parse(raw.line_items);
    } catch {
      return { error: "Invalid line items data" };
    }
  }

  const parsed = createInvoiceSchema.safeParse({
    ...raw,
    line_items: lineItems,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  // Calculate totals
  const subtotal = parsed.data.line_items.reduce((sum, item) => {
    return sum + item.quantity * item.unit_price;
  }, 0);
  const taxRate = parsed.data.tax_rate ?? 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Generate invoice number (simple sequential)
  const { count } = await ctx.supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", ctx.orgId);

  const invoiceNumber = `INV-${String((count ?? 0) + 1).padStart(5, "0")}`;

  const { data: invoice, error: invError } = await ctx.supabase
    .from("invoices")
    .insert({
      organisation_id: ctx.orgId,
      invoice_number: invoiceNumber,
      contact_id: parsed.data.contact_id || null,
      deal_id: parsed.data.deal_id || null,
      status: "draft",
      issue_date: parsed.data.issue_date,
      due_date: parsed.data.due_date,
      currency: parsed.data.currency || "GBP",
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      amount_paid: 0,
      amount_due: total,
      payment_terms: parsed.data.payment_terms || null,
      notes: parsed.data.notes || null,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (invError) return { error: invError.message };

  // Insert line items
  const itemInserts = parsed.data.line_items.map((item, i) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate ?? 0,
    amount: item.quantity * item.unit_price,
    account_id: item.account_id || null,
    sort_order: i,
  }));

  const { error: itemsError } = await ctx.supabase
    .from("invoice_line_items")
    .insert(itemInserts);

  if (itemsError) return { error: itemsError.message };
  return { success: "Invoice created", data: { id: invoice.id, invoice_number: invoiceNumber } };
}

export async function updateInvoiceStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = updateInvoiceStatusSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "sent") updateData.sent_at = new Date().toISOString();
  if (parsed.data.status === "paid") updateData.paid_at = new Date().toISOString();
  if (parsed.data.status === "voided") updateData.voided_at = new Date().toISOString();

  const { error } = await ctx.supabase
    .from("invoices")
    .update(updateData)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  return { success: `Invoice ${parsed.data.status}` };
}

// ─── Payments ───────────────────────────────────────────────────────────────

export async function recordPayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createPaymentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  // Get invoice to validate payment
  const { data: invoice } = await ctx.supabase
    .from("invoices")
    .select("id, amount_due, amount_paid, total, status")
    .eq("id", parsed.data.invoice_id)
    .single();

  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "voided") return { error: "Cannot pay a voided invoice" };
  if (parsed.data.amount > invoice.amount_due) {
    return { error: `Payment exceeds amount due (${invoice.amount_due.toFixed(2)})` };
  }

  // Record payment
  const { error: payError } = await ctx.supabase.from("payments").insert({
    organisation_id: ctx.orgId,
    invoice_id: parsed.data.invoice_id,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method || "bank_transfer",
    reference: parsed.data.reference || null,
    notes: parsed.data.notes || null,
    recorded_by: ctx.user.id,
  });

  if (payError) return { error: payError.message };

  // Update invoice amounts
  const newAmountPaid = invoice.amount_paid + parsed.data.amount;
  const newAmountDue = invoice.total - newAmountPaid;
  const newStatus = newAmountDue <= 0 ? "paid" : "partially_paid";

  await ctx.supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      amount_due: newAmountDue,
      status: newStatus,
      ...(newStatus === "paid" ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq("id", parsed.data.invoice_id);

  return { success: "Payment recorded" };
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function submitExpense(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const { error } = await ctx.supabase.from("expenses").insert({
    organisation_id: ctx.orgId,
    submitted_by: ctx.user.id,
    category: parsed.data.category,
    description: parsed.data.description,
    amount: parsed.data.amount,
    currency: parsed.data.currency || "GBP",
    expense_date: parsed.data.expense_date,
    receipt_url: parsed.data.receipt_url || null,
    account_id: parsed.data.account_id || null,
    cost_centre_id: parsed.data.cost_centre_id || null,
  });

  if (error) return { error: error.message };
  return { success: "Expense submitted" };
}

export async function approveExpense(expenseId: string): Promise<ActionState> {
  const parsed = approveExpenseSchema.safeParse({ id: expenseId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  if (!["owner", "admin", "manager"].includes(ctx.role)) {
    return { error: "Insufficient permissions" };
  }

  const { error } = await ctx.supabase
    .from("expenses")
    .update({
      status: "approved",
      approved_by: ctx.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { success: "Expense approved" };
}

export async function rejectExpense(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = rejectExpenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  if (!["owner", "admin", "manager"].includes(ctx.role)) {
    return { error: "Insufficient permissions" };
  }

  const { error } = await ctx.supabase
    .from("expenses")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.rejection_reason,
      approved_by: ctx.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { success: "Expense rejected" };
}
