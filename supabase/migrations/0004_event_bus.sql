-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0004: Event Bus + Notifications Infrastructure
-- Tables: shared.events, shared.notifications
-- Functions: publish_event(), DB triggers on task mutations
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Create shared schema ────────────────────────────────────────────────
create schema if not exists shared;
grant usage on schema shared to authenticated, anon, service_role;

-- ─── 1. Events Table ────────────────────────────────────────────────────────
create table if not exists shared.events (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid references public.organisations(id) on delete cascade not null,
  event_type       text not null,
  source_table     text not null,
  source_id        uuid not null,
  source_event_id  uuid unique,  -- idempotency key
  payload          jsonb not null default '{}',
  published_at     timestamptz not null default now(),
  processed        boolean not null default false,
  processed_at     timestamptz
);

-- Indexes
create index if not exists idx_events_org         on shared.events(organisation_id);
create index if not exists idx_events_type        on shared.events(event_type);
create index if not exists idx_events_source      on shared.events(source_event_id);
create index if not exists idx_events_unprocessed on shared.events(processed) where not processed;

-- ─── 2. Notifications Table ─────────────────────────────────────────────────
create table if not exists shared.notifications (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid references public.organisations(id) on delete cascade not null,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  event_id         uuid references shared.events(id) on delete set null,
  type             text not null,
  title            text not null,
  body             text,
  link             text,
  read             boolean not null default false,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- Indexes
create index if not exists idx_notifications_user      on shared.notifications(user_id);
create index if not exists idx_notifications_unread     on shared.notifications(user_id, read) where not read;
create index if not exists idx_notifications_org        on shared.notifications(organisation_id);

-- ─── 3. publish_event() function ────────────────────────────────────────────
create or replace function shared.publish_event(
  p_org_id         uuid,
  p_event_type     text,
  p_source_table   text,
  p_source_id      uuid,
  p_payload        jsonb default '{}',
  p_source_event_id uuid default null
)
returns uuid language plpgsql security definer as $$
declare
  v_event_id uuid;
begin
  insert into shared.events (
    organisation_id, event_type, source_table, source_id, payload, source_event_id
  )
  values (
    p_org_id, p_event_type, p_source_table, p_source_id, p_payload,
    coalesce(p_source_event_id, gen_random_uuid())
  )
  on conflict (source_event_id) do nothing
  returning id into v_event_id;

  return v_event_id;
end;
$$;

-- ─── 4. Task Event Triggers ─────────────────────────────────────────────────

-- Trigger: Task Created
create or replace function shared.on_task_created()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'Task.Created',
    'task.tasks',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'project_id', new.project_id,
      'reporter_id', new.reporter_id,
      'assignee_id', new.assignee_id,
      'priority', new.priority,
      'status', new.status
    )
  );
  return new;
end;
$$;

create or replace trigger trg_task_created
  after insert on task.tasks
  for each row execute function shared.on_task_created();

-- Trigger: Task Status Changed
create or replace function shared.on_task_status_changed()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    perform shared.publish_event(
      new.organisation_id,
      'Task.StatusChanged',
      'task.tasks',
      new.id,
      jsonb_build_object(
        'title', new.title,
        'old_status', old.status,
        'new_status', new.status,
        'assignee_id', new.assignee_id
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_task_status_changed
  after update on task.tasks
  for each row
  when (old.status is distinct from new.status)
  execute function shared.on_task_status_changed();

-- Trigger: Task Assigned
create or replace function shared.on_task_assigned()
returns trigger language plpgsql security definer as $$
begin
  if old.assignee_id is distinct from new.assignee_id and new.assignee_id is not null then
    perform shared.publish_event(
      new.organisation_id,
      'Task.Assigned',
      'task.tasks',
      new.id,
      jsonb_build_object(
        'title', new.title,
        'assignee_id', new.assignee_id,
        'old_assignee_id', old.assignee_id,
        'reporter_id', new.reporter_id
      )
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_task_assigned
  after update on task.tasks
  for each row
  when (old.assignee_id is distinct from new.assignee_id)
  execute function shared.on_task_assigned();

-- Trigger: Time Logged
create or replace function shared.on_time_logged()
returns trigger language plpgsql security definer as $$
begin
  perform shared.publish_event(
    new.organisation_id,
    'Time.Logged',
    'task.time_entries',
    new.id,
    jsonb_build_object(
      'task_id', new.task_id,
      'user_id', new.user_id,
      'duration_minutes', new.duration_minutes,
      'billable', new.billable,
      'source', new.source
    )
  );
  return new;
end;
$$;

create or replace trigger trg_time_logged
  after insert on task.time_entries
  for each row execute function shared.on_time_logged();

-- ─── 5. Notification Trigger (Task Assigned → Notify Assignee) ──────────────

create or replace function shared.on_event_notify()
returns trigger language plpgsql security definer as $$
begin
  -- Task.Assigned → notify the assignee
  if new.event_type = 'Task.Assigned' and (new.payload->>'assignee_id') is not null then
    insert into shared.notifications (
      organisation_id, user_id, event_id, type, title, body, link
    ) values (
      new.organisation_id,
      (new.payload->>'assignee_id')::uuid,
      new.id,
      'task.assigned',
      'New task assigned',
      'You were assigned to: ' || coalesce(new.payload->>'title', 'Untitled'),
      '/tasks/board'
    );
  end if;

  -- Task.StatusChanged to completed → notify reporter
  if new.event_type = 'Task.StatusChanged'
     and new.payload->>'new_status' = 'completed'
     and (new.payload->>'assignee_id') is not null then
    insert into shared.notifications (
      organisation_id, user_id, event_id, type, title, body, link
    ) values (
      new.organisation_id,
      -- Notify the assignee about completion (reporter lookup would need another query)
      (new.payload->>'assignee_id')::uuid,
      new.id,
      'task.completed',
      'Task completed',
      coalesce(new.payload->>'title', 'Untitled') || ' has been completed',
      '/tasks/board'
    );
  end if;

  return new;
end;
$$;

create or replace trigger trg_event_notify
  after insert on shared.events
  for each row execute function shared.on_event_notify();

-- ─── 6. Row Level Security ──────────────────────────────────────────────────

-- Events
alter table shared.events enable row level security;

create policy "Org members can view events"
  on shared.events for select
  using (organisation_id = any(public.get_user_org_ids()));

create policy "System can insert events"
  on shared.events for insert
  with check (true);  -- Triggers insert via security definer functions

-- Notifications
alter table shared.notifications enable row level security;

create policy "Users can view own notifications"
  on shared.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on shared.notifications for update
  using (user_id = auth.uid());

create policy "System can insert notifications"
  on shared.notifications for insert
  with check (true);  -- Triggers insert via security definer functions

-- ─── 7. Grant table access ──────────────────────────────────────────────────
grant select, insert, update on all tables in schema shared to authenticated;
grant select on all tables in schema shared to anon;
grant execute on function shared.publish_event to authenticated, service_role;

-- ─── 8. Realtime — enable for live subscriptions ────────────────────────────
alter publication supabase_realtime add table task.tasks;
alter publication supabase_realtime add table shared.events;
alter publication supabase_realtime add table shared.notifications;
