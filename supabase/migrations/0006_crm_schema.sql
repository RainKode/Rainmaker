-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0006: CRM (Ringmaker) Schema
-- Tables: crm.companies, crm.contacts, crm.pipelines, crm.pipeline_stages,
--         crm.deals, crm.messages, crm.contact_comments, crm.lead_folders
-- Event triggers: Deal.StageChanged, Deal.Won, Deal.Lost,
--                 Message.Received, Message.Sent, LeadFolder.Submitted
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Create crm schema ──────────────────────────────────────────────────
create schema if not exists crm;
grant usage on schema crm to authenticated, anon, service_role;

-- ─── 1. Companies ───────────────────────────────────────────────────────────
create table if not exists crm.companies (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  name              text not null,
  domain            text,
  industry          text,
  size              text check (size in ('1-10', '11-50', '51-200', '201-500', '500+')),
  address           jsonb not null default '{}',
  phone             text,
  website           text,
  notes             text,
  custom_fields     jsonb not null default '{}',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 2. Pipelines ───────────────────────────────────────────────────────────
create table if not exists crm.pipelines (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  name              text not null,
  description       text,
  is_default        boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 3. Pipeline Stages ─────────────────────────────────────────────────────
create table if not exists crm.pipeline_stages (
  id                  uuid primary key default gen_random_uuid(),
  pipeline_id         uuid references crm.pipelines(id) on delete cascade not null,
  name                text not null,
  colour              text not null default '#7AA6B3',
  position            integer not null default 0,
  probability         integer not null default 0 check (probability >= 0 and probability <= 100),
  entry_conditions    jsonb not null default '{}',
  exit_conditions     jsonb not null default '{}',
  department_owner    text check (department_owner in ('leads', 'outreach', 'closers')),
  project_template_id uuid,
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 4. Contacts ────────────────────────────────────────────────────────────
create table if not exists crm.contacts (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid references public.organisations(id) on delete cascade not null,
  company_id            uuid references crm.companies(id) on delete set null,
  first_name            text not null,
  last_name             text not null,
  email                 text,
  phone                 text,
  pipeline_id           uuid references crm.pipelines(id) on delete set null,
  pipeline_stage_id     uuid references crm.pipeline_stages(id) on delete set null,
  deal_value            decimal(12,2),
  owner_id              uuid references public.profiles(id) on delete set null,
  lead_source           text,
  lead_score            integer not null default 0,
  department_owner      text check (department_owner in ('leads', 'outreach', 'closers')),
  tags                  text[] not null default '{}',
  custom_fields         jsonb not null default '{}',
  last_contact_date     timestamptz,
  total_hours_spent     decimal(10,2) not null default 0,
  total_billable_value  decimal(12,2) not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── 5. Deals ───────────────────────────────────────────────────────────────
create table if not exists crm.deals (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid references public.organisations(id) on delete cascade not null,
  contact_id          uuid references crm.contacts(id) on delete set null,
  pipeline_id         uuid references crm.pipelines(id) on delete cascade not null,
  stage_id            uuid references crm.pipeline_stages(id) on delete set null,
  name                text not null,
  value               decimal(12,2),
  currency            varchar(3) not null default 'GBP',
  expected_close_date timestamptz,
  owner_id            uuid references public.profiles(id) on delete set null,
  loss_reason         text,
  won_at              timestamptz,
  lost_at             timestamptz,
  line_items          jsonb not null default '[]',
  payment_terms       text,
  custom_fields       jsonb not null default '{}',
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 6. Messages ────────────────────────────────────────────────────────────
create table if not exists crm.messages (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid references public.organisations(id) on delete cascade not null,
  contact_id            uuid references crm.contacts(id) on delete set null,
  unipile_chat_id       text,
  unipile_message_id    text unique,
  channel               text not null
                          check (channel in ('whatsapp', 'email', 'linkedin', 'instagram', 'telegram', 'messenger')),
  direction             text not null
                          check (direction in ('inbound', 'outbound')),
  sender_identifier     text,
  sender_name           text,
  subject               text,
  body                  text,
  body_html             text,
  attachments           jsonb not null default '[]',
  thread_id             text,
  cc                    text[] not null default '{}',
  bcc                   text[] not null default '{}',
  sent_by_user_id       uuid references public.profiles(id) on delete set null,
  read                  boolean not null default false,
  timestamp             timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

-- ─── 7. Contact Comments ────────────────────────────────────────────────────
create table if not exists crm.contact_comments (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references crm.contacts(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  body        text not null,
  mentions    uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- ─── 8. Lead Folders ────────────────────────────────────────────────────────
create table if not exists crm.lead_folders (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid references public.organisations(id) on delete cascade not null,
  name              text not null,
  description       text,
  contact_ids       uuid[] not null default '{}',
  from_department   text not null check (from_department in ('leads', 'outreach', 'closers')),
  to_department     text not null check (to_department in ('leads', 'outreach', 'closers')),
  submitted_by      uuid references public.profiles(id) on delete set null,
  status            text not null default 'pending'
                      check (status in ('pending', 'in_progress', 'completed')),
  notes             text,
  submitted_at      timestamptz not null default now()
);

-- ─── 9. Indexes ─────────────────────────────────────────────────────────────

-- Companies
create index if not exists idx_companies_org       on crm.companies(organisation_id);
create index if not exists idx_companies_domain    on crm.companies(domain);
create index if not exists idx_companies_active    on crm.companies(is_active);

-- Pipelines
create index if not exists idx_pipelines_org       on crm.pipelines(organisation_id);

-- Pipeline Stages
create index if not exists idx_stages_pipeline     on crm.pipeline_stages(pipeline_id);
create index if not exists idx_stages_sort         on crm.pipeline_stages(pipeline_id, sort_order);

-- Contacts
create index if not exists idx_contacts_org        on crm.contacts(organisation_id);
create index if not exists idx_contacts_company    on crm.contacts(company_id);
create index if not exists idx_contacts_pipeline   on crm.contacts(pipeline_id);
create index if not exists idx_contacts_stage      on crm.contacts(pipeline_stage_id);
create index if not exists idx_contacts_owner      on crm.contacts(owner_id);
create index if not exists idx_contacts_dept       on crm.contacts(department_owner);
create index if not exists idx_contacts_score      on crm.contacts(lead_score);
create index if not exists idx_contacts_active     on crm.contacts(is_active);
create index if not exists idx_contacts_tags       on crm.contacts using gin (tags);
create index if not exists idx_contacts_custom     on crm.contacts using gin (custom_fields);

-- Full-text search on contacts
create index if not exists idx_contacts_fts
  on crm.contacts using gin (
    to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, ''))
  );

-- Deals
create index if not exists idx_deals_org           on crm.deals(organisation_id);
create index if not exists idx_deals_contact       on crm.deals(contact_id);
create index if not exists idx_deals_pipeline      on crm.deals(pipeline_id);
create index if not exists idx_deals_stage         on crm.deals(stage_id);
create index if not exists idx_deals_owner         on crm.deals(owner_id);
create index if not exists idx_deals_sort          on crm.deals(pipeline_id, stage_id, sort_order);
create index if not exists idx_deals_active        on crm.deals(is_active);

-- Messages
create index if not exists idx_messages_org        on crm.messages(organisation_id);
create index if not exists idx_messages_contact    on crm.messages(contact_id);
create index if not exists idx_messages_channel    on crm.messages(channel);
create index if not exists idx_messages_direction  on crm.messages(direction);
create index if not exists idx_messages_thread     on crm.messages(thread_id);
create index if not exists idx_messages_timestamp  on crm.messages(timestamp desc);
create index if not exists idx_messages_unread     on crm.messages(contact_id, read) where not read;

-- Contact Comments
create index if not exists idx_comments_contact    on crm.contact_comments(contact_id);
create index if not exists idx_comments_user       on crm.contact_comments(user_id);

-- Lead Folders
create index if not exists idx_lead_folders_org    on crm.lead_folders(organisation_id);
create index if not exists idx_lead_folders_status on crm.lead_folders(status);

-- ─── 10. Updated_at Triggers ────────────────────────────────────────────────

create or replace trigger set_companies_updated_at
  before update on crm.companies
  for each row execute function public.set_updated_at();

create or replace trigger set_pipelines_updated_at
  before update on crm.pipelines
  for each row execute function public.set_updated_at();

create or replace trigger set_stages_updated_at
  before update on crm.pipeline_stages
  for each row execute function public.set_updated_at();

create or replace trigger set_contacts_updated_at
  before update on crm.contacts
  for each row execute function public.set_updated_at();

create or replace trigger set_deals_updated_at
  before update on crm.deals
  for each row execute function public.set_updated_at();

-- ─── 11. Row Level Security ─────────────────────────────────────────────────

-- Companies
alter table crm.companies enable row level security;

create policy "Org members can view companies"
  on crm.companies for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create companies"
  on crm.companies for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Members can update companies"
  on crm.companies for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager', 'member')
  );

create policy "Admins can delete companies"
  on crm.companies for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Pipelines
alter table crm.pipelines enable row level security;

create policy "Org members can view pipelines"
  on crm.pipelines for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Managers can create pipelines"
  on crm.pipelines for insert
  with check (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Managers can update pipelines"
  on crm.pipelines for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
  );

create policy "Admins can delete pipelines"
  on crm.pipelines for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Pipeline Stages
alter table crm.pipeline_stages enable row level security;

create policy "Org members can view stages"
  on crm.pipeline_stages for select
  using (
    exists (
      select 1 from crm.pipelines p
      where p.id = pipeline_id
        and p.organisation_id = any(public.get_user_org_ids())
    )
  );

create policy "Managers can create stages"
  on crm.pipeline_stages for insert
  with check (
    exists (
      select 1 from crm.pipelines p
      where p.id = pipeline_id
        and public.get_user_role(p.organisation_id) in ('owner', 'admin', 'manager')
    )
  );

create policy "Managers can update stages"
  on crm.pipeline_stages for update
  using (
    exists (
      select 1 from crm.pipelines p
      where p.id = pipeline_id
        and public.get_user_role(p.organisation_id) in ('owner', 'admin', 'manager')
    )
  );

create policy "Admins can delete stages"
  on crm.pipeline_stages for delete
  using (
    exists (
      select 1 from crm.pipelines p
      where p.id = pipeline_id
        and public.get_user_role(p.organisation_id) in ('owner', 'admin')
    )
  );

-- Contacts
alter table crm.contacts enable row level security;

create policy "Org members can view contacts"
  on crm.contacts for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create contacts"
  on crm.contacts for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Members can update contacts"
  on crm.contacts for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager', 'member')
    or owner_id = auth.uid()
  );

create policy "Admins can delete contacts"
  on crm.contacts for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Deals
alter table crm.deals enable row level security;

create policy "Org members can view deals"
  on crm.deals for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create deals"
  on crm.deals for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Members can update own deals, managers can update any"
  on crm.deals for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
    or owner_id = auth.uid()
  );

create policy "Admins can delete deals"
  on crm.deals for delete
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin')
  );

-- Messages
alter table crm.messages enable row level security;

create policy "Org members can view messages"
  on crm.messages for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "System and members can insert messages"
  on crm.messages for insert
  with check (true);  -- Webhook inserts via service_role; members insert via authenticated

create policy "Members can update messages"
  on crm.messages for update
  using (organisation_id = any(public.get_user_org_ids()));

-- Contact Comments
alter table crm.contact_comments enable row level security;

create policy "Org members can view comments"
  on crm.contact_comments for select
  using (
    exists (
      select 1 from crm.contacts c
      where c.id = contact_id
        and c.organisation_id = any(public.get_user_org_ids())
    )
  );

create policy "Members can create comments"
  on crm.contact_comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from crm.contacts c
      where c.id = contact_id
        and c.organisation_id = any(public.get_user_org_ids())
    )
  );

-- Lead Folders
alter table crm.lead_folders enable row level security;

create policy "Org members can view lead folders"
  on crm.lead_folders for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "Members can create lead folders"
  on crm.lead_folders for insert
  with check (
    organisation_id = any(public.get_user_org_ids())
    and auth.uid() is not null
  );

create policy "Members can update lead folders"
  on crm.lead_folders for update
  using (
    public.get_user_role(organisation_id) in ('owner', 'admin', 'manager')
    or submitted_by = auth.uid()
  );

-- ─── 12. Grant table access ────────────────────────────────────────────────
grant select, insert, update, delete on all tables in schema crm to authenticated;
grant select on all tables in schema crm to anon;

-- ─── 13. Event Triggers ────────────────────────────────────────────────────

-- Deal Stage Changed
create or replace function shared.on_deal_stage_changed()
returns trigger language plpgsql security definer as $$
begin
  if old.stage_id is distinct from new.stage_id then
    perform shared.publish_event(
      new.organisation_id,
      'Deal.StageChanged',
      'crm.deals',
      new.id,
      jsonb_build_object(
        'name', new.name,
        'contact_id', new.contact_id,
        'pipeline_id', new.pipeline_id,
        'old_stage_id', old.stage_id,
        'new_stage_id', new.stage_id,
        'value', new.value,
        'owner_id', new.owner_id
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_deal_stage_changed
  after update on crm.deals
  for each row
  when (old.stage_id is distinct from new.stage_id)
  execute function shared.on_deal_stage_changed();

-- Deal Won
create or replace function shared.on_deal_won()
returns trigger language plpgsql security definer as $$
begin
  if old.won_at is null and new.won_at is not null then
    perform shared.publish_event(
      new.organisation_id,
      'Deal.Won',
      'crm.deals',
      new.id,
      jsonb_build_object(
        'name', new.name,
        'contact_id', new.contact_id,
        'value', new.value,
        'currency', new.currency,
        'owner_id', new.owner_id,
        'won_at', new.won_at
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_deal_won
  after update on crm.deals
  for each row
  when (old.won_at is null and new.won_at is not null)
  execute function shared.on_deal_won();

-- Deal Lost
create or replace function shared.on_deal_lost()
returns trigger language plpgsql security definer as $$
begin
  if old.lost_at is null and new.lost_at is not null then
    perform shared.publish_event(
      new.organisation_id,
      'Deal.Lost',
      'crm.deals',
      new.id,
      jsonb_build_object(
        'name', new.name,
        'contact_id', new.contact_id,
        'value', new.value,
        'loss_reason', new.loss_reason,
        'owner_id', new.owner_id,
        'lost_at', new.lost_at
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_deal_lost
  after update on crm.deals
  for each row
  when (old.lost_at is null and new.lost_at is not null)
  execute function shared.on_deal_lost();

-- Message Received
create or replace function shared.on_message_received()
returns trigger language plpgsql security definer as $$
begin
  if new.direction = 'inbound' then
    perform shared.publish_event(
      new.organisation_id,
      'Message.Received',
      'crm.messages',
      new.id,
      jsonb_build_object(
        'contact_id', new.contact_id,
        'channel', new.channel,
        'sender_identifier', new.sender_identifier,
        'sender_name', new.sender_name,
        'subject', new.subject
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_message_received
  after insert on crm.messages
  for each row
  when (new.direction = 'inbound')
  execute function shared.on_message_received();

-- Message Sent
create or replace function shared.on_message_sent()
returns trigger language plpgsql security definer as $$
begin
  if new.direction = 'outbound' then
    perform shared.publish_event(
      new.organisation_id,
      'Message.Sent',
      'crm.messages',
      new.id,
      jsonb_build_object(
        'contact_id', new.contact_id,
        'channel', new.channel,
        'sent_by_user_id', new.sent_by_user_id,
        'subject', new.subject
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_message_sent
  after insert on crm.messages
  for each row
  when (new.direction = 'outbound')
  execute function shared.on_message_sent();

-- Lead Folder Submitted
create or replace function shared.on_lead_folder_submitted()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'LeadFolder.Submitted',
    'crm.lead_folders',
    new.id,
    jsonb_build_object(
      'name', new.name,
      'from_department', new.from_department,
      'to_department', new.to_department,
      'submitted_by', new.submitted_by,
      'contact_count', array_length(new.contact_ids, 1)
    )
  );
  return new;
end;
$$;

create or replace trigger trg_lead_folder_submitted
  after insert on crm.lead_folders
  for each row execute function shared.on_lead_folder_submitted();

-- ─── 14. CRM Event Notifications ───────────────────────────────────────────

-- Extend the shared event notify function for CRM events
create or replace function shared.on_crm_event_notify()
returns trigger language plpgsql security definer as $$
begin
  -- Deal.Won → notify the deal owner
  if new.event_type = 'Deal.Won' and (new.payload->>'owner_id') is not null then
    insert into shared.notifications (
      organisation_id, user_id, event_id, type, title, body, link
    ) values (
      new.organisation_id,
      (new.payload->>'owner_id')::uuid,
      new.id,
      'deal.won',
      'Deal won!',
      coalesce(new.payload->>'name', 'Untitled') || ' has been marked as won',
      '/crm/pipelines'
    );
  end if;

  -- Message.Received → notify contact owner (if matched)
  if new.event_type = 'Message.Received' and (new.payload->>'contact_id') is not null then
    -- Find the contact owner
    insert into shared.notifications (
      organisation_id, user_id, event_id, type, title, body, link
    )
    select
      new.organisation_id,
      c.owner_id,
      new.id,
      'message.received',
      'New message from ' || coalesce(new.payload->>'sender_name', 'Unknown'),
      'Via ' || coalesce(new.payload->>'channel', 'unknown'),
      '/crm/inbox'
    from crm.contacts c
    where c.id = (new.payload->>'contact_id')::uuid
      and c.owner_id is not null;
  end if;

  -- LeadFolder.Submitted → notify would need department lead lookup
  -- Simplified: notify org admins
  if new.event_type = 'LeadFolder.Submitted' then
    insert into shared.notifications (
      organisation_id, user_id, event_id, type, title, body, link
    )
    select
      new.organisation_id,
      m.user_id,
      new.id,
      'lead_folder.submitted',
      'Lead folder submitted',
      coalesce(new.payload->>'name', 'Untitled') || ' — ' || coalesce(new.payload->>'' || 'contact_count', '0') || ' contacts',
      '/crm/lead-folders'
    from public.organisation_memberships m
    where m.organisation_id = new.organisation_id
      and m.role in ('owner', 'admin', 'manager')
      and m.is_active = true;
  end if;

  return new;
end;
$$;

create or replace trigger trg_crm_event_notify
  after insert on shared.events
  for each row
  when (new.event_type in ('Deal.Won', 'Deal.Lost', 'Message.Received', 'LeadFolder.Submitted'))
  execute function shared.on_crm_event_notify();

-- ─── 15. Realtime ───────────────────────────────────────────────────────────
alter publication supabase_realtime add table crm.contacts;
alter publication supabase_realtime add table crm.deals;
alter publication supabase_realtime add table crm.messages;

-- ─── 16. Default Pipeline Seed (on org creation) ───────────────────────────
-- Function to seed a default pipeline when a new org is created
create or replace function crm.seed_default_pipeline()
returns trigger language plpgsql security definer as $$
declare
  v_pipeline_id uuid;
begin
  -- Create a default pipeline for the new organisation
  insert into crm.pipelines (organisation_id, name, description, is_default)
  values (new.id, 'Sales Pipeline', 'Default sales pipeline', true)
  returning id into v_pipeline_id;

  -- Create default stages
  insert into crm.pipeline_stages (pipeline_id, name, colour, position, probability, department_owner, sort_order)
  values
    (v_pipeline_id, 'Lead',        '#7AA6B3', 0, 10, 'leads',    0),
    (v_pipeline_id, 'Prospect',    '#9EC6D1', 1, 25, 'outreach', 1),
    (v_pipeline_id, 'Proposal',    '#EE6C29', 2, 50, 'outreach', 2),
    (v_pipeline_id, 'Negotiation', '#D45A1E', 3, 75, 'closers',  3),
    (v_pipeline_id, 'Won',         '#3D4141', 4, 100, 'closers', 4);

  return new;
end;
$$;

create or replace trigger trg_seed_default_pipeline
  after insert on public.organisations
  for each row execute function crm.seed_default_pipeline();

-- ─── 17. Add FK from task.projects to crm.contacts and crm.deals ───────────
-- These columns already exist (added as nullable uuid in 0003), now add FKs
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_projects_client_contact'
  ) then
    alter table task.projects
      add constraint fk_projects_client_contact
      foreign key (client_contact_id)
      references crm.contacts(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_projects_deal'
  ) then
    alter table task.projects
      add constraint fk_projects_deal
      foreign key (deal_id)
      references crm.deals(id)
      on delete set null;
  end if;
end $$;
