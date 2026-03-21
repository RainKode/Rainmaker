Plan: Rainmaker — Phased Module Build Plan
TL;DR: Build Rainmaker module-by-module across 5 phases. The scaffold already exists (Next.js 16, Supabase, shadcn/ui, basic auth DB). Each phase is a shippable product increment — complete one before starting the next.

What's Already Done
Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui (base-nova) ✅
Supabase wired: client.ts, server.ts, middleware ✅
DB Migration 0001: profiles + subscriptions + triggers ✅
Button component ✅
No route groups, no pages, no modules yet
PHASE 0 — Auth & RBAC + App Shell
The skeleton everything hangs off. Must be fully done before any feature work.

Steps

DB migration 0002_auth_rbac.sql — organisations, workspaces, organisation_memberships, invitations, full users_profile spec + RLS
Auth pages — route group (auth): /login, /register, /forgot-password, /reset-password, /accept-invitation/[token]
Onboarding wizard — first login → create-org → invite team → done
RBAC helpers — usePermissions() hook + server-side checkPermission() + middleware org-context check
App shell — (dashboard)/layout.tsx: sidebar, top bar (org switcher, search placeholder, timer placeholder, notification bell, avatar), responsive (bottom nav on mobile)
Org & workspace settings pages — /settings/organisation, /settings/members
Invitation flow — invite by email → Resend sends link → accept page creates membership
Key files to create

supabase/migrations/0002_auth_rbac.sql · src/app/(auth)/login/page.tsx · src/app/(dashboard)/layout.tsx · src/lib/rbac/permissions.ts · src/lib/hooks/usePermissions.ts · src/components/shared/sidebar.tsx · src/components/shared/topbar.tsx
Verification

Register → login → logout → password reset all work
New org creation seeds default workspace + chart-of-accounts placeholder
Invitation email arrives, acceptance creates correct role membership
usePermissions() returns correct map for all 5 roles
App shell is responsive at desktop / tablet / mobile
PHASE 1 — Task Management
Depends on Phase 0. Deliverable: a working task tool.

Breaking into sub-modules, each one builds on the previous:

1A — Project + Task CRUD
Migration 0003_task_schema.sql — task.projects, task.tasks, task.time_entries, task.task_dependencies + RLS + full-text indexes
Project CRUD (create/edit/archive)
Task drawer with all fields — title, rich text description (TipTap), status, assignee, priority, type, dates, billable, checklist, tags, watchers
1B — Kanban Board View
DnD Kit columns per status, WIP limits display, swimlanes, filter bar
Optimistic update on drag + Supabase Realtime multi-user sync
Task card: title, assignee avatar, priority pill, due date, checklist progress
1C — List View
TanStack Table: column config, sort, multi-level group, inline edit, bulk actions (reassign, status, priority), CSV export
Column preferences saved to user profile JSONB
1D — Time Tracking
Timer mode: Start/Stop on task, Zustand state + Redis persistence, active timer in top bar header
Manual mode: log time form (date + duration or start/end)
Time entries list on task drawer (edit/delete own)
1E — My Tasks / Today View
Sections: Overdue, Due Today, Due This Week, No Due Date
One-click timer start
1F — Event Bus Infrastructure (required before Phase 2 + 3)
Migration 0004_event_bus.sql — shared.events table + publish_event() function + DB triggers on task/time_entry mutations
Supabase Realtime subscription setup src/lib/events/realtime.ts
1G — In-App Notifications
shared.notifications table migration
Notification bell + slide-out panel, Realtime subscription, unread badge
Edge Function: Task.Assigned → notification for assignee
1H — Global Search
tsvector index on task title + description
GET /api/search?q= API route, results panel (shadcn Command → Cmd+K)
Verification

Full task CRUD with all fields persists correctly
Kanban drag triggers status transition + publishes event to shared.events
Timer persists cross-navigation, auto-stops when new one starts
My Tasks buckets tasks correctly by due date
Notification bell shows badge on task assignment event
PHASE 2 — CRM (Ringmaker)
Depends on Phase 0 + Phase 1 Event Bus. Deliverable: CRM + Universal Inbox.

2A — Contacts & Companies
Migration 0006_crm_schema.sql — crm.companies, crm.contacts, crm.contact_comments, crm.lead_folders, crm.messages
Contact list (searchable/filterable table), detail page with activity timeline + linked tasks panel, @mention comments
Company CRUD + company→contacts relation, CSV import with field mapping
2B — Pipeline & Deals
crm.pipelines, crm.pipeline_stages, crm.deals tables
Pipeline Kanban — contact cards, drag to move stage → Deal.StageChanged event
Deal CRUD (linked to contact, line items, expected close date)
Pipeline stage settings (probability, department owner, project_template_id)
2C — Universal Inbox (Unipile)
POST /api/webhooks/unipile — HMAC validation, contact matching, message creation
Inbox UI: channel list, conversation list, thread view, compose panel
Outbound message via Unipile API
Unassigned queue + manual contact matching
Create Task from selected messages (open task drawer pre-populated with contact + message body)
2D — Cross-Module Integration
Edge Function: CRM subscribes to Task.Completed → update contact timeline
Contact activity timeline aggregates: messages, tasks, stage changes
Lead folder handoff workflow + notification to receiving department
2E — Lead Scoring & Automations (CRM-level)
Scoring rules engine (field conditions → score calculation)
Auto-stage changes from inbox activity (configurable rules)
Verification

Inbound Unipile webhook creates message, matches existing contact by phone/email
Outbound message logs to DB + updates last_contact_date
Pipeline drag fires Deal.StageChanged → contact timeline shows it
Task drawer opened from inbox correctly pre-fills contact_id
Lead folder submission notifies the receiving department lead
PHASE 3 — ERP Foundation
Depends on Phase 0 + Phase 1 events + Phase 2 deals. Deliverable: financial backbone.

3A — Chart of Accounts & Periods
Migration 0008_erp_schema.sql — erp.chart_of_accounts (seeded on org creation), erp.accounting_periods, erp.cost_centres
Accounts tree view (hierarchy), account type, active toggle
Period management: open/close/lock, guard new entries to open periods only
3B — Journal Entry Engine
erp.journal_entries + erp.journal_entry_lines tables
Manual entry UI with live debit/credit balance check
API validation: debits = credits, active account, open period, unique source_event_id
Edge Function erp-journal-processor — subscribes to shared.events, maps event type → account pair → posts journal entry
Event-to-account mapping config UI
3C — Invoicing
erp.invoices + erp.payments tables
Invoice CRUD (manual + auto-generated on Deal.Won)
Status lifecycle: draft → sent → paid / overdue / voided
Payment recording with partial support + AR settlement journal entry
Invoice email send via Resend
3D — Expense Management
erp.expenses table
Expense submission (category, amount, date, receipt upload to Supabase Storage)
Manager approval queue → on approval auto-creates journal entry
3E — Basic Financial Reports
Trial Balance, simple P&L (by period), AR Ageing (0–30, 31–60, 61–90, 90+ days)
Verification

Manual journal entry blocked if debits ≠ credits
Completing billable task → Time.Logged event → Unbilled Revenue journal entry auto-created
Deal.Won → invoice auto-generated + AR journal entry
source_event_id uniqueness blocks replayed event from double-posting
Trial Balance debits = credits across all accounts
PHASE 4 — Advanced Features
Depends on all prior phases.

Sub-Module	What
4A Asset Register	erp.assets, depreciation scheduling, pg_cron monthly journal entries, assignment history
4B Advanced Task Views	Timesheet grid, Gantt (DnD dependencies, critical path), Calendar (Google Calendar sync), Workload capacity view
4C Automation Engine	shared.automation_rules builder UI, condition evaluator, cross-module actions, Edge Function processor
4D Cross-Module Reports	Employee ROI, Client Profitability, Org Health Dashboard (widgets)
4E Summary Dashboard	Configurable widget layout (react-grid-layout), per-user preferences
PHASE 5 — Polish & Scale
Production hardening.

Financial Statements (Balance Sheet, Income Statement, Cash Flow) — PDF + Excel export
Public REST API with API key auth + OpenAPI docs
2FA (TOTP via Supabase Auth MFA + org-enforced setting)
Audit Log (immutable table, DB triggers on all module tables, Admin query UI)
Advanced search (enhanced pg_trgm / Elasticsearch)
Command palette (Cmd+K with cmdk)
Performance: Redis caching for dashboard aggregates, query tuning, edge rendering
Security hardening: OWASP audit, CSP headers, HMAC webhooks, rate limit all routes
Mobile responsive polish + additional Unipile channels (LinkedIn, Instagram, Telegram)
Dependency Order

Phase 0 (Auth/RBAC/Shell)  └── Phase 1 (Task Management)        ├── 1F: Event Bus  ← must complete before Phase 2 + 3        └── Phase 2 (CRM)              └── Phase 3 (ERP)                    └── Phase 4 (Advanced)                          └── Phase 5 (Polish)
Key decisions

Phase 0 is non-negotiable first — the shell, auth, and RBAC are hard dependencies for everything
Each phase is independently shippable and usable as a standalone product increment
Unipile channels: WhatsApp + Email in Phase 2; LinkedIn/Instagram/Telegram deferred to Phase 5
Google Calendar sync is Phase 4, not Phase 1
No Elasticsearch until Phase 5 — PostgreSQL full-text is sufficient until then
Automation engine is Phase 4, not Phase 2 — basic CRM works without it
The plan is saved and ready. We can begin Phase 0 at any time — just say the word and switch to an implementation session.

Claude Sonnet 4.6 • 1x