// ─── Account Types ──────────────────────────────────────────────────────────
export const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

// ─── Account Sub-Types ──────────────────────────────────────────────────────
export const ACCOUNT_SUB_TYPES = [
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
] as const;
export type AccountSubType = (typeof ACCOUNT_SUB_TYPES)[number];

export const ACCOUNT_SUB_TYPE_LABELS: Record<AccountSubType, string> = {
  current_asset: "Current Asset",
  accounts_receivable: "Accounts Receivable",
  fixed_asset: "Fixed Asset",
  contra_asset: "Contra Asset",
  current_liability: "Current Liability",
  accounts_payable: "Accounts Payable",
  owner_equity: "Owner Equity",
  retained_earnings: "Retained Earnings",
  operating_revenue: "Operating Revenue",
  unbilled_revenue: "Unbilled Revenue",
  cogs: "Cost of Goods Sold",
  operating_expense: "Operating Expense",
};

// ─── Normal Balance ─────────────────────────────────────────────────────────
export const NORMAL_BALANCES = ["debit", "credit"] as const;
export type NormalBalance = (typeof NORMAL_BALANCES)[number];

// ─── Period Statuses ────────────────────────────────────────────────────────
export const PERIOD_STATUSES = ["open", "closed", "locked"] as const;
export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

export const PERIOD_STATUS_LABELS: Record<PeriodStatus, string> = {
  open: "Open",
  closed: "Closed",
  locked: "Locked",
};

// ─── Journal Sources ────────────────────────────────────────────────────────
export const JOURNAL_SOURCES = ["manual", "auto", "system"] as const;
export type JournalSource = (typeof JOURNAL_SOURCES)[number];

export const JOURNAL_SOURCE_LABELS: Record<JournalSource, string> = {
  manual: "Manual",
  auto: "Automated",
  system: "System",
};

// ─── Invoice Statuses ───────────────────────────────────────────────────────
export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "voided",
  "partially_paid",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  voided: "Voided",
  partially_paid: "Partially Paid",
};

// ─── Payment Methods ────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "card",
  "cheque",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};

// ─── Expense Categories ─────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
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
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  travel: "Travel",
  meals: "Meals",
  supplies: "Supplies",
  software: "Software",
  equipment: "Equipment",
  marketing: "Marketing",
  professional_services: "Professional Services",
  rent: "Rent",
  utilities: "Utilities",
  other: "Other",
};

// ─── Expense Statuses ───────────────────────────────────────────────────────
export const EXPENSE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "reimbursed",
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  reimbursed: "Reimbursed",
};

// ─── Chart of Accounts ──────────────────────────────────────────────────────
export type Account = {
  id: string;
  organisation_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  account_type: AccountType;
  sub_type: AccountSubType | null;
  currency: string;
  description: string | null;
  normal_balance: NormalBalance;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Account with children for tree view
export type AccountTreeNode = Account & {
  children: AccountTreeNode[];
  balance?: number;
};

// ─── Accounting Period ──────────────────────────────────────────────────────
export type AccountingPeriod = {
  id: string;
  organisation_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  closed_by: string | null;
  closed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Cost Centre ────────────────────────────────────────────────────────────
export type CostCentre = {
  id: string;
  organisation_id: string;
  code: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Journal Entry ──────────────────────────────────────────────────────────
export type JournalEntry = {
  id: string;
  organisation_id: string;
  period_id: string;
  entry_date: string;
  reference: string | null;
  description: string;
  source: JournalSource;
  source_event_id: string | null;
  posted_by: string | null;
  is_reversed: boolean;
  reversal_of: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type JournalEntryLine = {
  id: string;
  journal_entry_id: string;
  account_id: string;
  cost_centre_id: string | null;
  description: string | null;
  debit: number;
  credit: number;
  created_at: string;
};

// Journal entry with lines + relations for display
export type JournalEntryWithLines = JournalEntry & {
  lines: (JournalEntryLine & {
    account: Pick<Account, "id" | "code" | "name"> | null;
    cost_centre: Pick<CostCentre, "id" | "code" | "name"> | null;
  })[];
  period: Pick<AccountingPeriod, "id" | "name"> | null;
  posted_by_profile: { id: string; full_name: string | null } | null;
};

// ─── Invoice ────────────────────────────────────────────────────────────────
export type Invoice = {
  id: string;
  organisation_id: string;
  invoice_number: string;
  contact_id: string | null;
  deal_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  payment_terms: string | null;
  notes: string | null;
  source_event_id: string | null;
  journal_entry_id: string | null;
  created_by: string | null;
  sent_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
  account_id: string | null;
  sort_order: number;
  created_at: string;
};

// Invoice with relations for display
export type InvoiceWithDetails = Invoice & {
  line_items: InvoiceLineItem[];
  contact: { id: string; first_name: string; last_name: string; email: string | null } | null;
  payments: Pick<Payment, "id" | "amount" | "payment_date" | "payment_method">[];
};

// ─── Payment ────────────────────────────────────────────────────────────────
export type Payment = {
  id: string;
  organisation_id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  journal_entry_id: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Expense ────────────────────────────────────────────────────────────────
export type Expense = {
  id: string;
  organisation_id: string;
  submitted_by: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  account_id: string | null;
  cost_centre_id: string | null;
  journal_entry_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Expense with relations for display
export type ExpenseWithSubmitter = Expense & {
  submitter: { id: string; full_name: string | null; avatar_url: string | null } | null;
  approver: { id: string; full_name: string | null } | null;
};

// ─── Report Types ───────────────────────────────────────────────────────────
export type TrialBalanceRow = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  debit_total: number;
  credit_total: number;
  balance: number;
};

export type ProfitLossRow = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: "revenue" | "expense";
  total: number;
};

export type ARAgeing = {
  contact_id: string;
  contact_name: string;
  current: number;      // 0-30 days
  days_31_60: number;
  days_61_90: number;
  over_90: number;
  total: number;
};
