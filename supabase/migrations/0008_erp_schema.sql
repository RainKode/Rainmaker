-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0008: ERP Foundation Schema
-- Tables: erp.chart_of_accounts, erp.accounting_periods, erp.cost_centres,
--         erp.journal_entries, erp.journal_entry_lines,
--         erp.invoices, erp.invoice_line_items, erp.payments, erp.expenses
-- Event triggers: Journal.Created, Invoice.Created, Invoice.StatusChanged,
--                 Expense.Submitted, Expense.Approved, Payment.Recorded
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Create erp schema ──────────────────────────────────────────────────
create schema if not exists erp;
grant usage on schema erp to authenticated, anon, service_role;

-- ─── 1. Chart of Accounts ──────────────────────────────────────────────────
create table if not exists erp.chart_of_accounts (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  parent_id         uuid references erp.chart_of_accounts(id) on delete set null,
  code              text not null,
  name              text not null,
  account_type      text not null
                      check (account_type in (
                        'asset', 'liability', 'equity', 'revenue', 'expense'
                      )),
  sub_type          text,  -- e.g. 'current_asset', 'fixed_asset', 'accounts_receivable', etc.
  currency          varchar(3) not null default 'GBP',
  description       text,
  normal_balance    text not null default 'debit'
                      check (normal_balance in ('debit', 'credit')),
  is_system         boolean not null default false,  -- system accounts cannot be deleted
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organisation_id, code)
);

-- ─── 2. Accounting Periods ─────────────────────────────────────────────────
create table if not exists erp.accounting_periods (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  name              text not null,
  start_date        date not null,
  end_date          date not null,
  status            text not null default 'open'
                      check (status in ('open', 'closed', 'locked')),
  closed_by         uuid references public.profiles(id) on delete set null,
  closed_at         timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organisation_id, name),
  check (end_date > start_date)
);

-- ─── 3. Cost Centres ───────────────────────────────────────────────────────
create table if not exists erp.cost_centres (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  code              text not null,
  name              text not null,
  description       text,
  manager_id        uuid references public.profiles(id) on delete set null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organisation_id, code)
);

-- ─── 4. Journal Entries ─────────────────────────────────────────────────────
create table if not exists erp.journal_entries (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  period_id         uuid references erp.accounting_periods(id) on delete restrict not null,
  entry_date        date not null,
  reference         text,
  description       text not null,
  source            text not null default 'manual'
                      check (source in ('manual', 'auto', 'system')),
  source_event_id   uuid unique,  -- idempotency: link to shared.events.id
  posted_by         uuid references public.profiles(id) on delete set null,
  is_reversed       boolean not null default false,
  reversal_of       uuid references erp.journal_entries(id) on delete set null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 5. Journal Entry Lines ─────────────────────────────────────────────────
create table if not exists erp.journal_entry_lines (
  id                uuid primary key default gen_random_uuid(),
  journal_entry_id  uuid references erp.journal_entries(id) on delete cascade not null,
  account_id        uuid references erp.chart_of_accounts(id) on delete restrict not null,
  cost_centre_id    uuid references erp.cost_centres(id) on delete set null,
  description       text,
  debit             decimal(14,2) not null default 0 check (debit >= 0),
  credit            decimal(14,2) not null default 0 check (credit >= 0),
  created_at        timestamptz not null default now(),
  check (debit > 0 or credit > 0),           -- at least one must be positive
  check (not (debit > 0 and credit > 0))      -- cannot have both on same line
);

-- ─── 6. Balance check constraint (function + trigger) ──────────────────────
-- Ensures total debits = total credits per journal entry on insert/update/delete of lines
create or replace function erp.check_journal_balance()
returns trigger language plpgsql as $$
declare
  v_total_debit  decimal(14,2);
  v_total_credit decimal(14,2);
  v_entry_id     uuid;
begin
  v_entry_id := coalesce(new.journal_entry_id, old.journal_entry_id);

  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
  into v_total_debit, v_total_credit
  from erp.journal_entry_lines
  where journal_entry_id = v_entry_id;

  if v_total_debit <> v_total_credit then
    raise exception 'Journal entry % is unbalanced: debits (%) ≠ credits (%)',
      v_entry_id, v_total_debit, v_total_credit;
  end if;

  return coalesce(new, old);
end;
$$;

-- Deferred constraint trigger: runs at end of transaction so all lines can be inserted first
create constraint trigger trg_check_journal_balance
  after insert or update or delete on erp.journal_entry_lines
  deferrable initially deferred
  for each row
  execute function erp.check_journal_balance();

-- ─── 7. Invoices ────────────────────────────────────────────────────────────
create table if not exists erp.invoices (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  invoice_number    text not null,
  contact_id        uuid references crm.contacts(id) on delete set null,
  deal_id           uuid references crm.deals(id) on delete set null,
  status            text not null default 'draft'
                      check (status in ('draft', 'sent', 'paid', 'overdue', 'voided', 'partially_paid')),
  issue_date        date not null,
  due_date          date not null,
  currency          varchar(3) not null default 'GBP',
  subtotal          decimal(14,2) not null default 0,
  tax_rate          decimal(5,2) not null default 0,
  tax_amount        decimal(14,2) not null default 0,
  total             decimal(14,2) not null default 0,
  amount_paid       decimal(14,2) not null default 0,
  amount_due        decimal(14,2) not null default 0,
  payment_terms     text,
  notes             text,
  source_event_id   uuid unique,  -- idempotency for auto-generated invoices
  journal_entry_id  uuid references erp.journal_entries(id) on delete set null,
  created_by        uuid references public.profiles(id) on delete set null,
  sent_at           timestamptz,
  paid_at           timestamptz,
  voided_at         timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organisation_id, invoice_number)
);

-- ─── 8. Invoice Line Items ──────────────────────────────────────────────────
create table if not exists erp.invoice_line_items (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid references erp.invoices(id) on delete cascade not null,
  description       text not null,
  quantity          decimal(10,2) not null default 1,
  unit_price        decimal(14,2) not null,
  tax_rate          decimal(5,2) not null default 0,
  amount            decimal(14,2) not null,
  account_id        uuid references erp.chart_of_accounts(id) on delete set null,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

-- ─── 9. Payments ────────────────────────────────────────────────────────────
create table if not exists erp.payments (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  invoice_id        uuid references erp.invoices(id) on delete cascade not null,
  amount            decimal(14,2) not null check (amount > 0),
  payment_date      date not null,
  payment_method    text not null default 'bank_transfer'
                      check (payment_method in (
                        'bank_transfer', 'cash', 'card', 'cheque', 'other'
                      )),
  reference         text,
  notes             text,
  journal_entry_id  uuid references erp.journal_entries(id) on delete set null,
  recorded_by       uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 10. Expenses ───────────────────────────────────────────────────────────
create table if not exists erp.expenses (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  submitted_by      uuid references public.profiles(id) on delete set null not null,
  category          text not null
                      check (category in (
                        'travel', 'meals', 'supplies', 'software', 'equipment',
                        'marketing', 'professional_services', 'rent', 'utilities', 'other'
                      )),
  description       text not null,
  amount            decimal(14,2) not null check (amount > 0),
  currency          varchar(3) not null default 'GBP',
  expense_date      date not null,
  receipt_url       text,  -- Supabase Storage path
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected', 'reimbursed')),
  approved_by       uuid references public.profiles(id) on delete set null,
  approved_at       timestamptz,
  rejection_reason  text,
  account_id        uuid references erp.chart_of_accounts(id) on delete set null,
  cost_centre_id    uuid references erp.cost_centres(id) on delete set null,
  journal_entry_id  uuid references erp.journal_entries(id) on delete set null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 11. Indexes ────────────────────────────────────────────────────────────

-- Chart of Accounts
create index if not exists idx_coa_org          on erp.chart_of_accounts(organisation_id);
create index if not exists idx_coa_parent       on erp.chart_of_accounts(parent_id);
create index if not exists idx_coa_type         on erp.chart_of_accounts(account_type);
create index if not exists idx_coa_active       on erp.chart_of_accounts(is_active);

-- Accounting Periods
create index if not exists idx_periods_org      on erp.accounting_periods(organisation_id);
create index if not exists idx_periods_status   on erp.accounting_periods(status);
create index if not exists idx_periods_dates    on erp.accounting_periods(start_date, end_date);

-- Cost Centres
create index if not exists idx_cc_org           on erp.cost_centres(organisation_id);
create index if not exists idx_cc_active        on erp.cost_centres(is_active);

-- Journal Entries
create index if not exists idx_je_org           on erp.journal_entries(organisation_id);
create index if not exists idx_je_period        on erp.journal_entries(period_id);
create index if not exists idx_je_date          on erp.journal_entries(entry_date);
create index if not exists idx_je_source        on erp.journal_entries(source);
create index if not exists idx_je_source_event  on erp.journal_entries(source_event_id);
create index if not exists idx_je_active        on erp.journal_entries(is_active);

-- Journal Entry Lines
create index if not exists idx_jel_entry        on erp.journal_entry_lines(journal_entry_id);
create index if not exists idx_jel_account      on erp.journal_entry_lines(account_id);
create index if not exists idx_jel_cc           on erp.journal_entry_lines(cost_centre_id);

-- Invoices
create index if not exists idx_inv_org          on erp.invoices(organisation_id);
create index if not exists idx_inv_contact      on erp.invoices(contact_id);
create index if not exists idx_inv_deal         on erp.invoices(deal_id);
create index if not exists idx_inv_status       on erp.invoices(status);
create index if not exists idx_inv_due_date     on erp.invoices(due_date);
create index if not exists idx_inv_active       on erp.invoices(is_active);

-- Invoice Line Items
create index if not exists idx_ili_invoice      on erp.invoice_line_items(invoice_id);

-- Payments
create index if not exists idx_pay_org          on erp.payments(organisation_id);
create index if not exists idx_pay_invoice      on erp.payments(invoice_id);
create index if not exists idx_pay_date         on erp.payments(payment_date);

-- Expenses
create index if not exists idx_exp_org          on erp.expenses(organisation_id);
create index if not exists idx_exp_submitted_by on erp.expenses(submitted_by);
create index if not exists idx_exp_status       on erp.expenses(status);
create index if not exists idx_exp_date         on erp.expenses(expense_date);
create index if not exists idx_exp_category     on erp.expenses(category);
create index if not exists idx_exp_active       on erp.expenses(is_active);

-- ─── 12. Updated_at Triggers ────────────────────────────────────────────────

create or replace trigger set_coa_updated_at
  before update on erp.chart_of_accounts
  for each row execute function public.set_updated_at();

create or replace trigger set_periods_updated_at
  before update on erp.accounting_periods
  for each row execute function public.set_updated_at();

create or replace trigger set_cc_updated_at
  before update on erp.cost_centres
  for each row execute function public.set_updated_at();

create or replace trigger set_je_updated_at
  before update on erp.journal_entries
  for each row execute function public.set_updated_at();

create or replace trigger set_invoices_updated_at
  before update on erp.invoices
  for each row execute function public.set_updated_at();

create or replace trigger set_payments_updated_at
  before update on erp.payments
  for each row execute function public.set_updated_at();

create or replace trigger set_expenses_updated_at
  before update on erp.expenses
  for each row execute function public.set_updated_at();

-- ─── 13. Row Level Security ─────────────────────────────────────────────────

-- Chart of Accounts
alter table erp.chart_of_accounts enable row level security;

create policy "Org members can view accounts"
  on erp.chart_of_accounts for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Admins can create accounts"
  on erp.chart_of_accounts for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can update accounts"
  on erp.chart_of_accounts for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can delete non-system accounts"
  on erp.chart_of_accounts for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
    and not is_system
  );

-- Accounting Periods
alter table erp.accounting_periods enable row level security;

create policy "Org members can view periods"
  on erp.accounting_periods for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Admins can create periods"
  on erp.accounting_periods for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

create policy "Admins can update periods"
  on erp.accounting_periods for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Cost Centres
alter table erp.cost_centres enable row level security;

create policy "Org members can view cost centres"
  on erp.cost_centres for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Admins can create cost centres"
  on erp.cost_centres for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can update cost centres"
  on erp.cost_centres for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can delete cost centres"
  on erp.cost_centres for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Journal Entries
alter table erp.journal_entries enable row level security;

create policy "Org members can view journal entries"
  on erp.journal_entries for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members with permission can create journal entries"
  on erp.journal_entries for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can update journal entries"
  on erp.journal_entries for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Journal Entry Lines (access via parent journal entry)
alter table erp.journal_entry_lines enable row level security;

create policy "Org members can view journal lines"
  on erp.journal_entry_lines for select
  using (
    exists (
      select 1 from erp.journal_entries je
      where je.id = journal_entry_id
        and je.organisation_id = any(public.get_user_org_ids())
    )
  );

create policy "Members can create journal lines"
  on erp.journal_entry_lines for insert
  with check (
    exists (
      select 1 from erp.journal_entries je
      where je.id = journal_entry_id
        and public.get_user_role(je.organisation_id) in ('owner', 'admin', 'manager')
    )
  );

create policy "Admins can update journal lines"
  on erp.journal_entry_lines for update
  using (
    exists (
      select 1 from erp.journal_entries je
      where je.id = journal_entry_id
        and public.get_user_role(je.organisation_id) in ('owner', 'admin')
    )
  );

create policy "Admins can delete journal lines"
  on erp.journal_entry_lines for delete
  using (
    exists (
      select 1 from erp.journal_entries je
      where je.id = journal_entry_id
        and public.get_user_role(je.organisation_id) in ('owner', 'admin')
    )
  );

-- Invoices
alter table erp.invoices enable row level security;

create policy "Org members can view invoices"
  on erp.invoices for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create invoices"
  on erp.invoices for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Members can update invoices"
  on erp.invoices for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
    or created_by = auth.uid()
  );

create policy "Admins can delete invoices"
  on erp.invoices for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Invoice Line Items
alter table erp.invoice_line_items enable row level security;

create policy "Org members can view invoice lines"
  on erp.invoice_line_items for select
  using (
    exists (
      select 1 from erp.invoices inv
      where inv.id = invoice_id
        and inv.organisation_id = any(public.get_user_org_ids())
    )
  );

create policy "Members can create invoice lines"
  on erp.invoice_line_items for insert
  with check (
    exists (
      select 1 from erp.invoices inv
      where inv.id = invoice_id
        and public.get_user_role(inv.organisation_id) in ('owner', 'admin', 'manager')
    )
  );

create policy "Members can update invoice lines"
  on erp.invoice_line_items for update
  using (
    exists (
      select 1 from erp.invoices inv
      where inv.id = invoice_id
        and public.get_user_role(inv.organisation_id) in ('owner', 'admin', 'manager')
    )
  );

create policy "Admins can delete invoice lines"
  on erp.invoice_line_items for delete
  using (
    exists (
      select 1 from erp.invoices inv
      where inv.id = invoice_id
        and public.get_user_role(inv.organisation_id) in ('owner', 'admin')
    )
  );

-- Payments
alter table erp.payments enable row level security;

create policy "Org members can view payments"
  on erp.payments for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create payments"
  on erp.payments for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can update payments"
  on erp.payments for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Expenses
alter table erp.expenses enable row level security;

create policy "Org members can view expenses"
  on erp.expenses for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can submit expenses"
  on erp.expenses for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and submitted_by = auth.uid()
  );

create policy "Submitter can update pending, managers can update any"
  on erp.expenses for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
    or (submitted_by = auth.uid() and status = 'pending')
  );

-- ─── 14. Grant table access ────────────────────────────────────────────────
grant select, insert, update, delete on all tables in schema erp to authenticated;
grant select on all tables in schema erp to anon;

-- ─── 15. Event Triggers ────────────────────────────────────────────────────

-- Journal Entry Created
create or replace function shared.on_journal_created()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'Journal.Created',
    'erp.journal_entries',
    new.id,
    jsonb_build_object(
      'entry_date', new.entry_date,
      'reference', new.reference,
      'description', new.description,
      'source', new.source,
      'posted_by', new.posted_by
    )
  );
  return new;
end;
$$;

create or replace trigger trg_journal_created
  after insert on erp.journal_entries
  for each row execute function shared.on_journal_created();

-- Invoice Created
create or replace function shared.on_invoice_created()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'Invoice.Created',
    'erp.invoices',
    new.id,
    jsonb_build_object(
      'invoice_number', new.invoice_number,
      'contact_id', new.contact_id,
      'deal_id', new.deal_id,
      'total', new.total,
      'currency', new.currency,
      'due_date', new.due_date,
      'created_by', new.created_by
    )
  );
  return new;
end;
$$;

create or replace trigger trg_invoice_created
  after insert on erp.invoices
  for each row execute function shared.on_invoice_created();

-- Invoice Status Changed
create or replace function shared.on_invoice_status_changed()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    perform shared.publish_event(
      new.organisation_id,
      'Invoice.StatusChanged',
      'erp.invoices',
      new.id,
      jsonb_build_object(
        'invoice_number', new.invoice_number,
        'old_status', old.status,
        'new_status', new.status,
        'total', new.total,
        'amount_paid', new.amount_paid
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_invoice_status_changed
  after update on erp.invoices
  for each row
  when (old.status is distinct from new.status)
  execute function shared.on_invoice_status_changed();

-- Expense Submitted
create or replace function shared.on_expense_submitted()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'Expense.Submitted',
    'erp.expenses',
    new.id,
    jsonb_build_object(
      'category', new.category,
      'amount', new.amount,
      'currency', new.currency,
      'submitted_by', new.submitted_by,
      'description', new.description
    )
  );
  return new;
end;
$$;

create or replace trigger trg_expense_submitted
  after insert on erp.expenses
  for each row execute function shared.on_expense_submitted();

-- Expense Approved
create or replace function shared.on_expense_approved()
returns trigger language plpgsql security definer as $$
begin
  if old.status = 'pending' and new.status = 'approved' then
    perform shared.publish_event(
      new.organisation_id,
      'Expense.Approved',
      'erp.expenses',
      new.id,
      jsonb_build_object(
        'category', new.category,
        'amount', new.amount,
        'currency', new.currency,
        'submitted_by', new.submitted_by,
        'approved_by', new.approved_by
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_expense_approved
  after update on erp.expenses
  for each row
  when (old.status = 'pending' and new.status = 'approved')
  execute function shared.on_expense_approved();

-- Payment Recorded
create or replace function shared.on_payment_recorded()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'Payment.Recorded',
    'erp.payments',
    new.id,
    jsonb_build_object(
      'invoice_id', new.invoice_id,
      'amount', new.amount,
      'payment_method', new.payment_method,
      'payment_date', new.payment_date,
      'recorded_by', new.recorded_by
    )
  );
  return new;
end;
$$;

create or replace trigger trg_payment_recorded
  after insert on erp.payments
  for each row execute function shared.on_payment_recorded();

-- ─── 16. ERP Event Notifications ───────────────────────────────────────────

create or replace function shared.on_erp_event_notify()
returns trigger language plpgsql security definer as $$
begin
  -- Expense.Submitted → notify org managers for approval
  if new.event_type = 'Expense.Submitted' then
    insert into shared.notifications (organisation_id, user_id, event_id, type, title, body, link)
    select
      new.organisation_id,
      om.user_id,
      new.id,
      'expense.submitted',
      'New expense submitted',
      coalesce(new.payload->>'description', 'Expense') || ' — ' || coalesce(new.payload->>'currency', 'GBP') || ' ' || coalesce(new.payload->>'amount', '0'),
      '/erp/expenses'
    from public.organisation_memberships om
    where om.organisation_id = new.organisation_id
      and om.role in ('owner', 'admin', 'manager')
      and om.is_active = true
      and om.user_id <> (new.payload->>'submitted_by')::uuid;
  end if;

  -- Expense.Approved → notify the submitter
  if new.event_type = 'Expense.Approved' and (new.payload->>'submitted_by') is not null then
    insert into shared.notifications (organisation_id, user_id, event_id, type, title, body, link)
    values (
      new.organisation_id,
      (new.payload->>'submitted_by')::uuid,
      new.id,
      'expense.approved',
      'Expense approved',
      'Your expense for ' || coalesce(new.payload->>'currency', 'GBP') || ' ' || coalesce(new.payload->>'amount', '0') || ' has been approved.',
      '/erp/expenses'
    );
  end if;

  -- Invoice.Created → notify creator (confirmation)
  if new.event_type = 'Invoice.Created' and (new.payload->>'created_by') is not null then
    insert into shared.notifications (organisation_id, user_id, event_id, type, title, body, link)
    values (
      new.organisation_id,
      (new.payload->>'created_by')::uuid,
      new.id,
      'invoice.created',
      'Invoice created',
      'Invoice ' || coalesce(new.payload->>'invoice_number', '') || ' — ' || coalesce(new.payload->>'currency', 'GBP') || ' ' || coalesce(new.payload->>'total', '0'),
      '/erp/invoices'
    );
  end if;

  return new;
end;
$$;

create or replace trigger trg_erp_event_notify
  after insert on shared.events
  for each row
  when (new.event_type in ('Expense.Submitted', 'Expense.Approved', 'Invoice.Created'))
  execute function shared.on_erp_event_notify();

-- ─── 17. Seed Chart of Accounts on Org Creation ────────────────────────────
-- Extends the existing org creation trigger to seed default COA
create or replace function erp.seed_chart_of_accounts()
returns trigger language plpgsql security definer as $$
begin
  -- Assets
  insert into erp.chart_of_accounts (organisation_id, code, name, account_type, sub_type, normal_balance, is_system) values
    (new.id, '1000', 'Assets',                  'asset',     null,                   'debit',  true),
    (new.id, '1100', 'Cash & Bank',             'asset',     'current_asset',        'debit',  true),
    (new.id, '1200', 'Accounts Receivable',     'asset',     'accounts_receivable',  'debit',  true),
    (new.id, '1300', 'Prepaid Expenses',        'asset',     'current_asset',        'debit',  false),
    (new.id, '1500', 'Fixed Assets',            'asset',     'fixed_asset',          'debit',  false),
    (new.id, '1510', 'Accumulated Depreciation','asset',     'contra_asset',         'credit', false);

  -- Liabilities
  insert into erp.chart_of_accounts (organisation_id, code, name, account_type, sub_type, normal_balance, is_system) values
    (new.id, '2000', 'Liabilities',             'liability', null,                   'credit', true),
    (new.id, '2100', 'Accounts Payable',        'liability', 'accounts_payable',     'credit', true),
    (new.id, '2200', 'Accrued Expenses',        'liability', 'current_liability',    'credit', false),
    (new.id, '2300', 'Tax Payable',             'liability', 'current_liability',    'credit', false);

  -- Equity
  insert into erp.chart_of_accounts (organisation_id, code, name, account_type, sub_type, normal_balance, is_system) values
    (new.id, '3000', 'Equity',                  'equity',    null,                   'credit', true),
    (new.id, '3100', 'Owner Equity',            'equity',    'owner_equity',         'credit', true),
    (new.id, '3200', 'Retained Earnings',       'equity',    'retained_earnings',    'credit', true);

  -- Revenue
  insert into erp.chart_of_accounts (organisation_id, code, name, account_type, sub_type, normal_balance, is_system) values
    (new.id, '4000', 'Revenue',                 'revenue',   null,                   'credit', true),
    (new.id, '4100', 'Service Revenue',         'revenue',   'operating_revenue',    'credit', true),
    (new.id, '4200', 'Product Revenue',         'revenue',   'operating_revenue',    'credit', false),
    (new.id, '4900', 'Unbilled Revenue',        'revenue',   'unbilled_revenue',     'credit', true);

  -- Expenses
  insert into erp.chart_of_accounts (organisation_id, code, name, account_type, sub_type, normal_balance, is_system) values
    (new.id, '5000', 'Expenses',                'expense',   null,                   'debit',  true),
    (new.id, '5100', 'Cost of Goods Sold',      'expense',   'cogs',                 'debit',  false),
    (new.id, '5200', 'Salaries & Wages',        'expense',   'operating_expense',    'debit',  false),
    (new.id, '5300', 'Rent & Utilities',        'expense',   'operating_expense',    'debit',  false),
    (new.id, '5400', 'Marketing',               'expense',   'operating_expense',    'debit',  false),
    (new.id, '5500', 'Travel & Entertainment',  'expense',   'operating_expense',    'debit',  false),
    (new.id, '5600', 'Professional Services',   'expense',   'operating_expense',    'debit',  false),
    (new.id, '5700', 'Software & Subscriptions','expense',   'operating_expense',    'debit',  false),
    (new.id, '5800', 'Office Supplies',         'expense',   'operating_expense',    'debit',  false),
    (new.id, '5900', 'Depreciation',            'expense',   'operating_expense',    'debit',  false),
    (new.id, '5999', 'Other Expenses',          'expense',   'operating_expense',    'debit',  false);

  return new;
end;
$$;

create or replace trigger trg_seed_coa_on_org_create
  after insert on public.organisations
  for each row execute function erp.seed_chart_of_accounts();

-- ─── 18. Guard journal entries to open periods ──────────────────────────────
create or replace function erp.guard_open_period()
returns trigger language plpgsql as $$
declare
  v_status text;
begin
  select status into v_status
  from erp.accounting_periods
  where id = new.period_id;

  if v_status is null then
    raise exception 'Accounting period not found';
  end if;

  if v_status <> 'open' then
    raise exception 'Cannot post journal entry to % period', v_status;
  end if;

  return new;
end;
$$;

create or replace trigger trg_guard_open_period
  before insert on erp.journal_entries
  for each row execute function erp.guard_open_period();

-- ─── 19. Enable Realtime ───────────────────────────────────────────────────
alter publication supabase_realtime add table erp.journal_entries;
alter publication supabase_realtime add table erp.invoices;
alter publication supabase_realtime add table erp.expenses;
alter publication supabase_realtime add table erp.payments;
