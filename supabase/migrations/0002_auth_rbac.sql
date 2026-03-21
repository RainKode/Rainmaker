-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0002: Auth & RBAC — Organisations, Workspaces, Memberships,
-- Invitations, Profile extensions
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Organisations ────────────────────────────────────────────────────────
create table if not exists public.organisations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null unique,
  logo_url               text,
  owner_id               uuid references public.profiles(id) on delete restrict not null,
  default_currency       text not null default 'GBP',
  fiscal_year_start_month integer not null default 1 check (fiscal_year_start_month between 1 and 12),
  timezone               text not null default 'UTC',
  settings               jsonb not null default '{}',
  subscription_plan      text not null default 'free'
                           check (subscription_plan in ('free', 'starter', 'pro', 'enterprise')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── 2. Workspaces ──────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  name              text not null,
  description       text,
  is_default        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 3. Organisation Memberships ────────────────────────────────────────────
create table if not exists public.organisation_memberships (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references public.profiles(id) on delete cascade not null,
  organisation_id        uuid references public.organisations(id) on delete cascade not null,
  role                   text not null default 'member'
                           check (role in ('owner', 'admin', 'manager', 'member', 'guest')),
  department             text,
  hourly_rate            decimal(10,2),
  salary_cost_monthly    decimal(10,2),
  available_hours_weekly integer not null default 40,
  joined_at              timestamptz not null default now(),
  is_active              boolean not null default true,
  unique (user_id, organisation_id)
);

-- ─── 4. Invitations ────────────────────────────────────────────────────────
create table if not exists public.invitations (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  role              text not null default 'member'
                      check (role in ('owner', 'admin', 'manager', 'member', 'guest')),
  invited_by        uuid references public.profiles(id) on delete set null,
  token             uuid not null unique default gen_random_uuid(),
  expires_at        timestamptz not null default (now() + interval '7 days'),
  status            text not null default 'pending'
                      check (status in ('pending', 'accepted', 'expired')),
  created_at        timestamptz not null default now()
);

-- ─── 5. Extend profiles ────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists phone              text,
  add column if not exists timezone           text not null default 'UTC',
  add column if not exists language           text not null default 'en',
  add column if not exists theme              text not null default 'system'
                                                check (theme in ('light', 'dark', 'system')),
  add column if not exists date_format        text not null default 'DD/MM/YYYY',
  add column if not exists notification_prefs jsonb not null default '{}',
  add column if not exists last_login_at      timestamptz,
  add column if not exists status             text not null default 'active'
                                                check (status in ('active', 'suspended', 'invited'));

-- Drop old simple role column (roles now live in organisation_memberships)
alter table public.profiles drop column if exists role;

-- ─── 6. Add organisation_id to subscriptions ────────────────────────────────
alter table public.subscriptions
  add column if not exists organisation_id uuid references public.organisations(id) on delete cascade;

-- ─── 7. Indexes ─────────────────────────────────────────────────────────────
create index if not exists idx_org_memberships_user
  on public.organisation_memberships(user_id);
create index if not exists idx_org_memberships_org
  on public.organisation_memberships(organisation_id);
create index if not exists idx_workspaces_org
  on public.workspaces(organisation_id);
create index if not exists idx_invitations_token
  on public.invitations(token);
create index if not exists idx_invitations_org
  on public.invitations(organisation_id);
create index if not exists idx_organisations_slug
  on public.organisations(slug);

-- ─── 8. Helper functions ────────────────────────────────────────────────────

-- Returns array of org IDs the current user belongs to (for RLS)
create or replace function public.get_user_org_ids()
returns uuid[] language sql security definer stable as $$
  select coalesce(
    array_agg(organisation_id),
    '{}'::uuid[]
  )
  from public.organisation_memberships
  where user_id = auth.uid() and is_active = true;
$$;

-- Returns the role of the current user in a specific org
create or replace function public.get_user_role(p_org_id uuid)
returns text language sql security definer stable as $$
  select role
  from public.organisation_memberships
  where user_id = auth.uid()
    and organisation_id = p_org_id
    and is_active = true
  limit 1;
$$;

-- ─── 9. Updated_at triggers ─────────────────────────────────────────────────

-- Reusable trigger function (may already exist from 0001)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_organisations_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

create or replace trigger set_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ─── 10. Auto-create default workspace on org creation ──────────────────────
create or replace function public.handle_new_organisation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspaces (organisation_id, name, is_default)
  values (new.id, 'Default', true);
  return new;
end;
$$;

create or replace trigger on_organisation_created
  after insert on public.organisations
  for each row execute function public.handle_new_organisation();

-- ─── 11. Update handle_new_user to set status ──────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'active'
  );
  return new;
end;
$$;

-- ─── 12. Row Level Security ─────────────────────────────────────────────────

-- Organisations
alter table public.organisations enable row level security;

create policy "Org members can view their organisations"
  on public.organisations for select
  using (id = any(public.get_user_org_ids()));

create policy "Org owner can update organisation"
  on public.organisations for update
  using (
    public.get_user_role(id) in ('owner', 'admin')
  );

create policy "Authenticated users can create organisations"
  on public.organisations for insert
  with check (auth.uid() is not null);

-- Workspaces
alter table public.workspaces enable row level security;

create policy "Org members can view workspaces"
  on public.workspaces for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Admins can manage workspaces"
  on public.workspaces for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

create policy "Admins can update workspaces"
  on public.workspaces for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

create policy "Admins can delete workspaces"
  on public.workspaces for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Organisation Memberships
alter table public.organisation_memberships enable row level security;

create policy "Org members can view memberships"
  on public.organisation_memberships for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Admins can insert memberships"
  on public.organisation_memberships for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin')
    or user_id = auth.uid() -- allow self-insert during org creation
  );

create policy "Admins can update memberships"
  on public.organisation_memberships for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

create policy "Admins can delete memberships"
  on public.organisation_memberships for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Invitations
alter table public.invitations enable row level security;

create policy "Admins can view invitations"
  on public.invitations for select
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
    or email = (select email from public.profiles where id = auth.uid())
  );

create policy "Admins can create invitations"
  on public.invitations for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

create policy "Admins can update invitations"
  on public.invitations for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
    or email = (select email from public.profiles where id = auth.uid())
  );

-- Update profiles policies for new columns
-- Drop & recreate to be safe (idempotent with IF EXISTS)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow org members to see each other's profiles
create policy "Org members can view colleague profiles"
  on public.profiles for select
  using (
    id in (
      select om.user_id from public.organisation_memberships om
      where om.organisation_id = any(public.get_user_org_ids())
        and om.is_active = true
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Subscriptions: re-scope to org
drop policy if exists "Users can view own subscription" on public.subscriptions;

create policy "Org members can view subscription"
  on public.subscriptions for select
  using (
    organisation_id = any(public.get_user_org_ids())
    or user_id = auth.uid()
  );
