import { z } from "zod/v4";

// ─── Chart of Accounts ──────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  parent_id: z.string().uuid().optional(),
  code: z.string().min(1, "Account code is required").max(20),
  name: z.string().min(1, "Account name is required").max(200),
  account_type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  sub_type: z
    .enum([
      "current_asset",
      "accounts_receivable",
      "fixed_asset",
      "contra_asset",
      "current_liability",
      "accounts_payable",
      "owner_equity",
      "retained_earnings",
      "operating_revenue",
      "unbilled_revenue",
      "cogs",
      "operating_expense",
    ])
    .optional(),
  currency: z.string().length(3).optional(),
  description: z.string().max(500).optional(),
  normal_balance: z.enum(["debit", "credit"]).optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ─── Accounting Periods ─────────────────────────────────────────────────────

export const createPeriodSchema = z.object({
  name: z.string().min(1, "Period name is required").max(100),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;

export const updatePeriodStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "closed", "locked"]),
});

// ─── Cost Centres ───────────────────────────────────────────────────────────

export const createCostCentreSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  manager_id: z.string().uuid().optional(),
});
export type CreateCostCentreInput = z.infer<typeof createCostCentreSchema>;

// ─── Journal Entries ────────────────────────────────────────────────────────

export const journalEntryLineSchema = z.object({
  account_id: z.string().uuid("Account is required"),
  cost_centre_id: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  debit: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().min(0)),
  credit: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().min(0)),
});

export const createJournalEntrySchema = z.object({
  period_id: z.string().uuid("Accounting period is required"),
  entry_date: z.string().min(1, "Entry date is required"),
  reference: z.string().max(100).optional(),
  description: z.string().min(1, "Description is required").max(500),
  lines: z
    .array(journalEntryLineSchema)
    .min(2, "At least 2 lines required"),
});
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

// ─── Invoices ───────────────────────────────────────────────────────────────

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 1 : Number(v)))
    .pipe(z.number().positive()),
  unit_price: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().min(0)),
  tax_rate: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().min(0).max(100))
    .optional(),
  account_id: z.string().uuid().optional(),
});

export const createInvoiceSchema = z.object({
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  currency: z.string().length(3).optional(),
  tax_rate: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().min(0).max(100))
    .optional(),
  payment_terms: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  line_items: z
    .array(invoiceLineItemSchema)
    .min(1, "At least 1 line item required"),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "sent", "paid", "overdue", "voided", "partially_paid"]),
});

// ─── Payments ───────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  invoice_id: z.string().uuid("Invoice is required"),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().positive("Amount must be positive")),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum([
    "bank_transfer",
    "cash",
    "card",
    "cheque",
    "other",
  ]).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ─── Expenses ───────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  category: z.enum([
    "travel",
    "meals",
    "supplies",
    "software",
    "equipment",
    "marketing",
    "professional_services",
    "rent",
    "utilities",
    "other",
  ]),
  description: z.string().min(1, "Description is required").max(500),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().positive("Amount must be positive")),
  currency: z.string().length(3).optional(),
  expense_date: z.string().min(1, "Expense date is required"),
  receipt_url: z.string().url().optional(),
  account_id: z.string().uuid().optional(),
  cost_centre_id: z.string().uuid().optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const approveExpenseSchema = z.object({
  id: z.string().uuid(),
});

export const rejectExpenseSchema = z.object({
  id: z.string().uuid(),
  rejection_reason: z.string().min(1, "Reason is required").max(500),
});
