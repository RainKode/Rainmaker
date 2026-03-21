-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0003: Task Management Schema
-- Tables: task.projects, task.tasks, task.time_entries, task.task_dependencies
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Create task schema ──────────────────────────────────────────────────
create schema if not exists task;

-- Grant usage so Supabase clients can query this schema
grant usage on schema task to authenticated, anon, service_role;

-- ─── 1. Projects ────────────────────────────────────────────────────────────
create table if not exists task.projects (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid references public.organisations(id) on delete cascade not null,
  workspace_id         uuid references public.workspaces(id) on delete set null,
  name                 text not null,
  description          text,
  status               text not null default 'active'
                         check (status in ('active', 'completed', 'archived', 'on_hold')),
  owner_id             uuid references public.profiles(id) on delete set null,
  client_contact_id    uuid,  -- FK to crm.contacts added in Phase 2
  deal_id              uuid,  -- FK to crm.deals added in Phase 2
  start_date           timestamptz,
  target_end_date      timestamptz,
  default_billable     boolean not null default false,
  default_hourly_rate  decimal(10,2),
  settings             jsonb not null default '{}',
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── 2. Tasks ───────────────────────────────────────────────────────────────
create table if not exists task.tasks (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid references public.organisations(id) on delete cascade not null,
  project_id            uuid references task.projects(id) on delete cascade,
  title                 text not null,
  description           jsonb,  -- TipTap JSON content
  status                text not null default 'created'
                          check (status in (
                            'created', 'assigned', 'in_progress', 'in_review',
                            'completed', 'blocked', 'on_hold', 'closed'
                          )),
  assignee_id           uuid references public.profiles(id) on delete set null,
  reporter_id           uuid references public.profiles(id) on delete set null not null,
  priority              text not null default 'medium'
                          check (priority in ('critical', 'high', 'medium', 'low')),
  task_type             text not null default 'other'
                          check (task_type in ('bug', 'feature', 'admin', 'meeting', 'support', 'other')),
  start_date            timestamptz,
  due_date              timestamptz,
  completed_at          timestamptz,
  time_estimate_minutes integer,
  billable              boolean not null default false,
  parent_task_id        uuid references task.tasks(id) on delete set null,
  tags                  text[] not null default '{}',
  checklist             jsonb not null default '[]',
  watchers              uuid[] not null default '{}',
  sort_order            integer not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── 3. Time Entries ────────────────────────────────────────────────────────
create table if not exists task.time_entries (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  task_id           uuid references task.tasks(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  start_time        timestamptz,
  end_time          timestamptz,
  duration_minutes  integer not null check (duration_minutes > 0),
  hourly_rate       decimal(10,2),
  billable          boolean not null default false,
  source            text not null default 'manual'
                      check (source in ('timer', 'manual', 'timesheet')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 4. Task Dependencies ───────────────────────────────────────────────────
create table if not exists task.task_dependencies (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  predecessor_id    uuid references task.tasks(id) on delete cascade not null,
  successor_id      uuid references task.tasks(id) on delete cascade not null,
  dependency_type   text not null default 'finish_to_start'
                      check (dependency_type in (
                        'finish_to_start', 'start_to_start',
                        'finish_to_finish', 'start_to_finish'
                      )),
  created_at        timestamptz not null default now(),
  unique (predecessor_id, successor_id)
);

-- ─── 5. Indexes ─────────────────────────────────────────────────────────────

-- Projects
create index if not exists idx_projects_org       on task.projects(organisation_id);
create index if not exists idx_projects_workspace  on task.projects(workspace_id);
create index if not exists idx_projects_owner      on task.projects(owner_id);
create index if not exists idx_projects_status     on task.projects(status);

-- Tasks
create index if not exists idx_tasks_org           on task.tasks(organisation_id);
create index if not exists idx_tasks_project       on task.tasks(project_id);
create index if not exists idx_tasks_assignee      on task.tasks(assignee_id);
create index if not exists idx_tasks_reporter      on task.tasks(reporter_id);
create index if not exists idx_tasks_status        on task.tasks(status);
create index if not exists idx_tasks_due_date      on task.tasks(due_date);
create index if not exists idx_tasks_parent        on task.tasks(parent_task_id);
create index if not exists idx_tasks_sort          on task.tasks(project_id, status, sort_order);
create index if not exists idx_tasks_tags          on task.tasks using gin (tags);

-- Full-text search on task title
create index if not exists idx_tasks_fts
  on task.tasks using gin (to_tsvector('english', title));

-- Time entries
create index if not exists idx_time_entries_org    on task.time_entries(organisation_id);
create index if not exists idx_time_entries_task   on task.time_entries(task_id);
create index if not exists idx_time_entries_user   on task.time_entries(user_id);

-- Dependencies
create index if not exists idx_deps_predecessor    on task.task_dependencies(predecessor_id);
create index if not exists idx_deps_successor      on task.task_dependencies(successor_id);

-- ─── 6. Updated_at Triggers ─────────────────────────────────────────────────

create or replace trigger set_projects_updated_at
  before update on task.projects
  for each row execute function public.set_updated_at();

create or replace trigger set_tasks_updated_at
  before update on task.tasks
  for each row execute function public.set_updated_at();

create or replace trigger set_time_entries_updated_at
  before update on task.time_entries
  for each row execute function public.set_updated_at();

-- ─── 7. Row Level Security ──────────────────────────────────────────────────

-- Projects
alter table task.projects enable row level security;

create policy "Org members can view projects"
  on task.projects for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create projects"
  on task.projects for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Project owners and admins can update projects"
  on task.projects for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
    or owner_id = auth.uid()
  );

create policy "Admins can delete projects"
  on task.projects for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Tasks
alter table task.tasks enable row level security;

create policy "Org members can view tasks"
  on task.tasks for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create tasks"
  on task.tasks for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Members can update own tasks, admins can update any"
  on task.tasks for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
    or assignee_id = auth.uid()
    or reporter_id = auth.uid()
  );

create policy "Admins can delete tasks"
  on task.tasks for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Time Entries
alter table task.time_entries enable row level security;

create policy "Org members can view time entries"
  on task.time_entries for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create time entries"
  on task.time_entries for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and user_id = auth.uid()
  );

create policy "Users can update own time entries"
  on task.time_entries for update
  using (
    user_id = auth.uid()
    or public.get_user_role(organisation_id) in ('owner', 'admin')
  );

create policy "Users can delete own time entries"
  on task.time_entries for delete
  using (
    user_id = auth.uid()
    or public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Task Dependencies
alter table task.task_dependencies enable row level security;

create policy "Org members can view task dependencies"
  on task.task_dependencies for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create task dependencies"
  on task.task_dependencies for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Members can delete task dependencies"
  on task.task_dependencies for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

-- ─── 8. Grant table access to roles ─────────────────────────────────────────
grant select, insert, update, delete on all tables in schema task to authenticated;
grant select on all tables in schema task to anon;
