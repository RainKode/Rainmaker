# Product Requirements Document: Rainmaker

## Complete Task Management + CRM + ERP Platform

**Version:** 1.0
**Date:** 2026-03-21
**Author:** RainKode
**Status:** Draft — Ready for TaskMaster Parsing

---

## 1. Project Overview

### 1.1 Problem Statement

Small and medium enterprises currently operate with fragmented tooling across task management, customer relationship management, and financial operations. Teams use separate apps for project tracking (Asana, Trello), CRM (HubSpot, Pipedrive), and accounting (Xero, QuickBooks), resulting in:

- **Data silos**: Employee productivity data lives in one tool, client revenue in another, and financial records in a third. No single view connects labour cost to client profitability.
- **Manual reconciliation**: Teams spend hours manually transferring data between systems — logging billable hours in a spreadsheet, copying deal values into invoices, updating contact records after task completion.
- **Blind spots**: Managers cannot answer fundamental business questions like "What is the ROI of this employee?" or "Is this client profitable after accounting for all labour and expenses?" without building custom reports from multiple data sources.
- **Communication fragmentation**: Client messages arrive across WhatsApp, Email, LinkedIn, and other channels. Reps juggle multiple apps and lose context. Messages are not linked to tasks, deals, or financial records.

### 1.2 Proposed Solution

Rainmaker is a unified business operations platform comprising three tightly integrated modules:

1. **Task Management** — Tracks all work performed by employees, measures productivity, provides labour data that feeds into CRM and ERP.
2. **CRM (codename: Ringmaker)** — Manages all external relationships (leads, prospects, clients, partners) with a Universal Inbox powered by Unipile for multi-channel communication.
3. **ERP (codename: Rainmaker)** — Captures every financial transaction, maintains the general ledger, manages assets, produces financial statements.

These three modules share a common data layer and Event Bus. Every user action in one module can trigger events, data updates, or notifications in another module. This interconnection is the fundamental design principle, not an afterthought.

### 1.3 Target Users

- **SME Owners/Founders** — Need a single dashboard showing cash position, pipeline value, team utilisation, and overdue items across the entire business.
- **Operations Managers** — Need to assign tasks, track team productivity, manage workloads, and produce reports that connect labour to revenue.
- **Sales/CRM Reps** — Need a unified inbox for all client communication channels, pipeline management, and the ability to create tasks directly from client messages.
- **Finance/Accounting Staff** — Need automated journal entries, invoicing from CRM deals, asset depreciation scheduling, and financial statement generation.
- **Team Members/Employees** — Need a clean task view, time tracking, and a single place to see everything assigned to them.

### 1.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to generate Employee ROI report | < 5 seconds (vs hours of manual work) | Automated from task + time + ERP data |
| Client profitability report accuracy | 100% data captured (no manual entry gaps) | All billable time auto-linked to contacts |
| Message response time | < 30 minutes average | Universal Inbox centralises all channels |
| Invoice creation from deal close | < 2 clicks | Auto-generated from Deal.Won event |
| Cross-module event latency | < 500ms | Event Bus processing time |
| User onboarding time | < 15 minutes to productive use | Guided setup wizard |

### 1.5 Constraints

- **Tech Stack**: Next.js (React + TypeScript), shadcn/ui component library, deployed on Vercel.
- **Database**: Supabase (PostgreSQL) as primary database with real-time subscriptions. Redis for caching. S3-compatible storage (Supabase Storage) for files.
- **External Dependencies**: Unipile API for multi-channel messaging (WhatsApp, Email, LinkedIn, Instagram, Telegram, Messenger). Google Workspace APIs for Calendar sync and Drive integration.
- **Architecture**: Modular monolith. Single Next.js app with module-specific route groups, shared data layer via Supabase, and an internal Event Bus (Supabase Realtime + database triggers + edge functions for async processing).
- **Deployment**: Vercel for the Next.js frontend and API routes. Supabase for database, auth, storage, and edge functions. No self-hosted infrastructure.
- **Team**: Solo developer (RainKode). Phased delivery over 30 weeks.
- **Budget**: Lean. Favour built-in Supabase features over third-party services where possible.

---

## 2. Technical Architecture

### 2.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js App)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  Auth &   │  │   Task   │  │   CRM    │  │     ERP       │   │
│  │  RBAC     │  │  Module  │  │  Module  │  │    Module     │   │
│  │  (Mod 0)  │  │  (Mod 1) │  │  (Mod 2) │  │   (Mod 3)    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │
│       │              │              │               │            │
│  ┌────┴──────────────┴──────────────┴───────────────┴────────┐  │
│  │                    Next.js API Routes                      │  │
│  │             (Server Actions + Route Handlers)              │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────┐  ┌──────────┴─────┐  ┌────────────┐  ┌─────────┐ │
│  │  Auth     │  │  PostgreSQL    │  │  Realtime   │  │ Storage │ │
│  │  (GoTrue) │  │  (Data Layer)  │  │ (Event Bus) │  │  (S3)   │ │
│  └──────────┘  └────────────────┘  └────────────┘  └─────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  Edge Functions   │  │  Database Triggers + Functions        │ │
│  │  (Async Workers)  │  │  (Event Publishing + Auto-Journal)   │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Unipile  │  │  Google   │  │  Redis   │  │  Elasticsearch   │ │
│  │  (Inbox) │  │ Workspace │  │ (Cache)  │  │  (Global Search) │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack Specification

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 14+ (App Router) | SSR, API routes, server actions, file-based routing |
| **Language** | TypeScript (strict mode) | Type safety across frontend and backend |
| **UI Components** | shadcn/ui + Radix UI + Tailwind CSS | Accessible, customisable component library |
| **State Management** | Zustand (client) + React Query / TanStack Query (server) | Client state + server state caching and synchronisation |
| **Database** | Supabase (PostgreSQL 15+) | Primary data store with RLS (Row Level Security) for multi-tenancy |
| **Auth** | Supabase Auth (GoTrue) | Email/password, OAuth (Google, Microsoft), magic links, 2FA |
| **Real-time** | Supabase Realtime | WebSocket subscriptions for live updates (Event Bus) |
| **File Storage** | Supabase Storage | Avatars, attachments, receipts, documents |
| **Edge Functions** | Supabase Edge Functions (Deno) | Async event processing, webhook handlers, scheduled jobs |
| **Caching** | Upstash Redis (serverless) | Session cache, rate limiting, real-time timer state |
| **Search** | Supabase full-text search (pg_trgm + tsvector) initially; Elasticsearch later | Global search across all modules |
| **Email** | Resend or Supabase Edge + SMTP | Transactional emails (notifications, invitations, password reset) |
| **Deployment** | Vercel | Zero-config Next.js hosting, edge network, preview deploys |
| **Monitoring** | Vercel Analytics + Sentry | Performance monitoring, error tracking |
| **Charts/Visualisation** | Recharts or Tremor | Dashboard widgets, reports, pipeline charts |

### 2.3 Database Schema Strategy

Supabase PostgreSQL with schema-per-module:

- `auth` — Supabase managed (users, sessions, tokens)
- `public.organisations` — Organisation and workspace data
- `public.users_profile` — Extended user profiles, preferences, org memberships
- `task` — All task management tables (tasks, projects, time_entries, labels, checklists)
- `crm` — All CRM tables (contacts, companies, deals, pipelines, stages, messages, lead_folders)
- `erp` — All ERP tables (chart_of_accounts, journal_entries, invoices, payments, assets, expenses, depreciation_schedules)
- `shared` — Cross-module tables (events, notifications, automation_rules, audit_log)

**Multi-tenancy**: Row Level Security (RLS) policies on every table, scoped by `organisation_id`. Every query automatically filtered to the current user's active organisation. No data leaks between organisations.

### 2.4 Event Bus Architecture

The Event Bus is implemented using Supabase database triggers + Supabase Realtime + Edge Functions:

1. **Event Table**: `shared.events` stores every event with: `event_id`, `event_type` (e.g., `Task.Completed`, `Deal.Won`), `payload` (JSONB), `source_module`, `organisation_id`, `created_at`, `processed` (boolean).
2. **Database Trigger**: On INSERT to domain tables (tasks, contacts, deals, journal_entries, etc.), a PostgreSQL trigger function inserts a row into `shared.events` with the appropriate event type and payload.
3. **Supabase Realtime**: The frontend subscribes to `shared.events` for live UI updates (notification badge, timeline refresh, Kanban card moves by other users).
4. **Edge Function Workers**: Supabase Edge Functions poll or are triggered by database webhooks on `shared.events` to process async side effects: auto-journal entries in ERP, CRM timeline updates, notification delivery, automation rule evaluation.
5. **Idempotency**: Each event has a unique `event_id`. Processing functions check for duplicate `source_event_id` before creating side effects. Replayed events do not create duplicate journal entries or notifications.

---

## 3. Module 0: User Authentication and Management

### 3.1 Overview

The foundation module that every other module depends on. Provides authentication, authorisation (RBAC), organisation management, workspace subdivision, and user profile management.

### 3.2 User Entity

**Table: `public.users_profile`** (extends Supabase `auth.users`)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key, FK to `auth.users.id` | NOT NULL, PK |
| `email` | String | Login email | UNIQUE, NOT NULL |
| `full_name` | String(255) | Display name | NOT NULL |
| `avatar_url` | String | Profile picture URL (Supabase Storage) | Nullable |
| `phone` | String(20) | Phone number | Nullable |
| `timezone` | String | IANA timezone (e.g., `Europe/London`) | Default: `UTC` |
| `language` | String(5) | Language code (e.g., `en`, `bn`) | Default: `en` |
| `theme` | Enum | `light`, `dark`, `system` | Default: `system` |
| `date_format` | String | e.g., `DD/MM/YYYY`, `MM/DD/YYYY` | Default: `DD/MM/YYYY` |
| `notification_prefs` | JSONB | Per-event-type notification channel preferences | Default: `{}` |
| `last_login_at` | Timestamp | Last successful login | Nullable |
| `status` | Enum | `active`, `suspended`, `invited` | Default: `invited` |
| `created_at` | Timestamp | Account creation time | Auto |
| `updated_at` | Timestamp | Last profile update | Auto |

**Table: `public.organisation_memberships`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users_profile.id` |
| `organisation_id` | UUID | FK → `organisations.id` |
| `role` | Enum | `owner`, `admin`, `manager`, `member`, `guest` |
| `department` | String | Optional department name |
| `hourly_rate` | Decimal(10,2) | Billable rate for this user in this org |
| `salary_cost_monthly` | Decimal(10,2) | Monthly salary cost for ROI calculations |
| `available_hours_weekly` | Integer | Default: 40. Used for workload capacity |
| `joined_at` | Timestamp | When user joined this org |
| `is_active` | Boolean | Soft disable without removing membership |

A user can belong to multiple organisations. Switching organisations changes the entire app context.

### 3.3 Organisation Entity

**Table: `public.organisations`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `name` | String(255) | Organisation name |
| `slug` | String(100) | URL-safe identifier, UNIQUE |
| `logo_url` | String | Organisation logo (Supabase Storage) |
| `owner_id` | UUID | FK → `users_profile.id`. Only one owner. |
| `default_currency` | String(3) | ISO currency code (e.g., `GBP`, `USD`) |
| `fiscal_year_start_month` | Integer | 1-12. Default: 1 (January) |
| `timezone` | String | Organisation-wide default timezone |
| `settings` | JSONB | Org-level config (2FA enforcement, session expiry, etc.) |
| `subscription_plan` | Enum | `free`, `starter`, `pro`, `enterprise` |
| `created_at` | Timestamp | Auto |

### 3.4 Workspace Entity

**Table: `public.workspaces`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK → `organisations.id` |
| `name` | String(255) | Workspace name |
| `description` | Text | Purpose of this workspace |
| `is_default` | Boolean | One default workspace per org |
| `created_at` | Timestamp | Auto |

Workspaces are optional subdivisions within an organisation. They share the same user base but can have their own projects, pipelines, and cost centres.

### 3.5 Roles and Permissions (RBAC)

Five roles with hierarchical permissions:

**Owner**: Full access to everything. Can manage billing, delete the organisation, manage all users and roles, transfer ownership. Only one Owner per Organisation.

**Admin**: Full access to all modules and settings. Can manage users, roles, organisation settings, automation rules, custom fields, chart of accounts, integration settings. Cannot manage billing or delete the organisation.

**Manager**: Full access to assigned modules and projects. Can create/manage projects, assign tasks, manage pipeline stages, approve expenses, run reports for their team. Cannot change organisation settings, manage users outside their team, or access financial records beyond their cost centre.

**Member**: Standard daily access. Can create/update own tasks, log time, use Universal Inbox for assigned contacts, submit expenses, view own reports. Cannot create projects, manage other users, or access financial summaries.

**Guest**: Limited read-only access. Can view specific projects or contacts they are invited to. Cannot create, edit, or delete any records. Cannot access financial data.

**Permission Matrix:**

| Capability | Owner/Admin | Manager | Member | Guest |
|-----------|-------------|---------|--------|-------|
| Create/Edit own tasks | Yes | Yes | Yes | No |
| Assign tasks to others | Yes | Yes | Limited (within project) | No |
| View all tasks in project | Yes | Yes | Assigned only | Invited only |
| Create projects | Yes | Yes | No | No |
| Access Universal Inbox | All contacts | Team contacts | Assigned contacts | No |
| Create/Edit CRM contacts | Yes | Yes | Limited | No |
| Move pipeline stages | Yes | Yes | Own pipeline only | No |
| View financial reports | Yes | Team cost centre | No | No |
| Record expenses/purchases | Yes | Yes | Submit for approval | No |
| Access asset register | Yes | View assigned | View own | No |
| Configure automations | Yes | Yes | No | No |
| Manage users/roles | Yes | No | No | No |

**Implementation**: Supabase RLS policies enforce permissions at the database level. A middleware layer in Next.js API routes checks `role` from the session before allowing mutations. The frontend uses a `usePermissions()` hook that returns a permission map based on the current user's role, used to conditionally render UI elements.

### 3.6 Authentication Features

**Email + Password Login**:
- Supabase Auth handles registration, login, and password hashing (bcrypt).
- Password requirements: minimum 8 characters, mixed case, at least one number.
- Rate limiting: 5 failed attempts triggers 15-minute lockout (Supabase Auth built-in + Upstash Redis for custom rate limiting on API routes).
- Password reset via email with time-limited token (Supabase Auth built-in).

**Two-Factor Authentication (2FA)**:
- Optional per user, enforceable org-wide by Owner/Admin.
- TOTP support (Google Authenticator, Authy) via Supabase Auth MFA.
- SMS-based codes as fallback (via Twilio integration in Edge Function).

**SSO/OAuth**:
- Google Workspace SSO via Supabase Auth OAuth provider.
- Microsoft Azure AD via Supabase Auth OAuth provider.
- On first SSO login, if user does not exist, create profile and prompt for organisation join/create.

**Session Management**:
- JWT-based sessions via Supabase Auth.
- Configurable expiry (default 24 hours, set in org `settings` JSONB).
- Active session list: query `auth.sessions` to show devices and last active time.
- Session revocation by Admin: delete session record.
- Suspicious login detection: Edge Function compares login IP/user-agent against last known values; if different, sends email notification.

**Invitation System**:
- Admin invites user by email.
- Invitation record created in `public.invitations` table with: `email`, `organisation_id`, `role`, `invited_by`, `token` (UUID), `expires_at` (7 days), `status` (pending/accepted/expired).
- Email sent via Resend/SMTP with org name, role, and secure link.
- Bulk invitation via CSV upload (Edge Function parses CSV, creates invitation records, sends batch emails).
- Expired invitations can be resent.

### 3.7 User Profile and Preferences

Each user has a profile visible to team members (name, avatar, role, department, timezone) and system preferences stored in `users_profile` and `notification_prefs` JSONB:

- Default view per module (e.g., Kanban for Task Management, Pipeline for CRM).
- Notification preferences per event type and channel (in-app, email, push).
- Language, date/time format, theme.

The `user_id` is the linkage point across all modules: every task assignment, time entry, message, expense, and asset assignment references a user. Querying all records by `user_id` produces a complete activity picture.

### 3.8 Cross-Module Connections

- **User → Task Management**: Assigned to tasks. Time entries logged against user_id. Workload view aggregates all assigned tasks. Productivity reports pull completion and time data.
- **User → CRM**: Owner of contacts and deals. Universal Inbox filtered by assigned contacts. Pipeline view filtered by owned deals.
- **User → ERP**: Salary cost for ROI calculations. Submits expenses. Assigned assets. Time entries feed labour cost calculations. Department membership determines cost centre allocation.

---

## 4. Module 1: Task Management

### 4.1 Overview

The operational engine of Rainmaker. Tracks all work performed by employees, measures productivity, and provides the labour data that feeds into CRM (client-linked tasks) and ERP (cost accounting).

### 4.2 Project Entity

**Table: `task.projects`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK → `organisations.id` |
| `workspace_id` | UUID | FK → `workspaces.id`, Nullable |
| `name` | String(255) | Project name |
| `description` | Text | Project description and goals |
| `status` | Enum | `active`, `paused`, `completed`, `archived` |
| `owner_id` | UUID | FK → `users_profile.id` (project lead) |
| `contact_id` | UUID | FK → `crm.contacts.id`, Nullable (client project) |
| `deal_id` | UUID | FK → `crm.deals.id`, Nullable |
| `colour` | String(7) | Hex colour for UI differentiation |
| `default_billable` | Boolean | Default billable flag for new tasks |
| `default_hourly_rate` | Decimal(10,2) | Default rate for billing |
| `cost_centre_id` | UUID | FK → `erp.cost_centres.id`, Nullable |
| `template_id` | UUID | FK → `task.project_templates.id`, Nullable (created from template) |
| `start_date` | Date | Nullable |
| `target_end_date` | Date | Nullable |
| `created_at` | Timestamp | Auto |
| `updated_at` | Timestamp | Auto |

### 4.3 Task Entity

**Table: `task.tasks`**

| Field | Type | Description | Sends Data To | Receives Data From |
|-------|------|-------------|--------------|-------------------|
| `id` | UUID | PK | CRM (task panel), ERP (billing) | Auto-generated |
| `organisation_id` | UUID | FK, RLS scoping | — | Auth context |
| `project_id` | UUID | FK → `task.projects.id` | Views, Reports, Permissions | User selection |
| `title` | String(255) | Human-readable task name | Notifications, Search, Views | User input |
| `description` | Text (rich text stored as JSON — TipTap/ProseMirror format) | Detailed context, acceptance criteria | CRM (when created from inbox) | User input, CRM messages |
| `status` | Enum | `created`, `assigned`, `in_progress`, `in_review`, `completed`, `blocked`, `on_hold`, `closed` | CRM timeline, ERP billing, Automation | User action, Automation |
| `assignee_id` | UUID | FK → `users_profile.id`, Nullable | Workload view, Notifications, Reports | User selection, Automation |
| `priority` | Enum | `critical`, `high`, `medium`, `low` | Sorting, Automation triggers | User input, Automation |
| `task_type` | Enum | `bug`, `feature`, `admin`, `meeting`, `support`, `other` | ERP cost centre, Reports | User selection, Template |
| `due_date` | Timestamp | Deadline | Calendar view, Overdue alerts | User input, Dependency calc |
| `start_date` | Timestamp | When work should begin | Gantt view, Scheduling | User input, Dependency calc |
| `time_estimate_minutes` | Integer | Expected effort in minutes | Workload balancing, Efficiency reports | User input, Template |
| `billable` | Boolean | Is this work billable? Default from project. | ERP (revenue accrual), Reports | User input, task_type default |
| `contact_id` | UUID | FK → `crm.contacts.id`, Nullable | CRM contact panel | CRM (task creation from inbox) |
| `deal_id` | UUID | FK → `crm.deals.id`, Nullable | CRM deal panel | CRM (task creation from deal) |
| `parent_task_id` | UUID | FK → self, Nullable (subtask support) | Parent task progress | User creation |
| `tags` | Text[] | PostgreSQL array, flexible categorisation | Filtering, Reports | User input |
| `custom_fields` | JSONB | User-defined fields | Reports, Automation | User input, Templates |
| `checklist` | JSONB | Array of `{id, text, completed}` | Progress bar on cards | User input |
| `watchers` | UUID[] | Array of user IDs who receive notifications | Notification Service | User opt-in |
| `rework_count` | Integer | Number of times rejected from review | Reports, Quality metrics | Auto-incremented on rejection |
| `blocking_task_id` | UUID | FK → self, Nullable (what's blocking this) | Dashboard blocked count | User selection |
| `blocked_reason` | Text | Why this task is blocked | Activity feed | User input |
| `hold_reason` | Text | Why this task is on hold | Activity feed | User input |
| `created_by` | UUID | FK → `users_profile.id` | Activity feed, Reports | Auto-captured |
| `completed_at` | Timestamp | Nullable, set on completion | Cycle time, ERP billing | Auto-captured |
| `created_at` | Timestamp | Auto | Cycle time calculation | Auto |
| `updated_at` | Timestamp | Auto | — | Auto |

**Indexes**: Composite index on `(organisation_id, project_id, status)`. Index on `assignee_id`. Index on `contact_id`. Index on `due_date`. Full-text search index on `title` and `description` using `tsvector`.

### 4.4 Task Lifecycle: State Transitions

Every status transition is an event published to the Event Bus.

**Created → Assigned**: Triggered when `assignee_id` is set on a task with status `created`.
- Notification sent to assignee via Notification Service.
- Workload view updated for assignee.
- Wait time clock starts (time between creation and first move to In Progress).
- If `contact_id` is set, CRM contact timeline shows "Task created for [contact name]".
- Event published: `Task.Assigned` with payload `{task_id, assignee_id, contact_id}`.

**Assigned → In Progress**: Triggered when assignee clicks "Start Work" or drags card to In Progress.
- Active work clock starts.
- Time tracker UI prompts user to start timer.
- Wait time recorded (`creation_to_active_duration`).
- Kanban card moves to In Progress column.
- Event published: `Task.Started` with payload `{task_id, started_at}`.

**In Progress → In Review**: Triggered when assignee marks task as ready for review.
- Active work clock pauses.
- Review clock starts.
- If approval workflow configured, designated reviewer notified.
- CRM contact timeline shows "Task [title] ready for review".
- Event published: `Task.ReviewRequested` with payload `{task_id, reviewer_id}`.

**In Review → Completed**: Triggered when reviewer approves.
- Review clock stops.
- `completed_at` timestamp captured.
- Total cycle time calculated (`created_at` to `completed_at`).
- If `billable` is true AND `contact_id` is set, ERP receives billing event with `total_billable_time`.
- CRM contact timeline shows "Task [title] completed".
- Notification sent to task creator and watchers.
- Event published: `Task.Completed` with payload `{task_id, total_time, billable_time, contact_id, deal_id}`.

**In Review → Rejected (Rework)**: Triggered when reviewer rejects with comment.
- Task returns to `in_progress`.
- `rework_count` incremented.
- Active work clock restarts.
- Rejection reason captured in activity feed.
- Notification sent to assignee with rejection comment.
- Event published: `Task.Rejected` with payload `{task_id, rejection_reason, rework_count}`.

**Any → Blocked**: Triggered when user flags task as blocked.
- Active work clock pauses.
- Blocked time clock starts.
- `blocking_task_id` and `blocked_reason` stored.
- Manager notification if blocked > configurable threshold (default 48 hours).
- Dashboard blocked count updated.
- Event published: `Task.Blocked` with payload `{task_id, blocking_task_id, reason}`.

**Any → On Hold**: Triggered by manager or assignee.
- All clocks pause.
- `hold_reason` captured.
- Task greyed out in Kanban view.
- Event published: `Task.OnHold` with payload `{task_id, reason}`.

**Completed → Closed**: Triggered automatically after configurable period (default 7 days) or manually by manager.
- Task removed from active views (still in search and historical reports).
- All time data finalised for ERP reporting.
- Event published: `Task.Closed` with payload `{task_id}`.

### 4.5 Time Tracking

**Table: `task.time_entries`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK, RLS scoping |
| `task_id` | UUID | FK → `task.tasks.id` |
| `user_id` | UUID | FK → `users_profile.id` |
| `start_time` | Timestamp | When work started |
| `end_time` | Timestamp | When work ended, Nullable (running timer) |
| `duration_minutes` | Integer | Calculated or manually entered |
| `description` | Text | What was done |
| `billable` | Boolean | Inherited from task, overridable |
| `hourly_rate` | Decimal(10,2) | Inherited from user profile or project |
| `source` | Enum | `timer`, `manual`, `timesheet` |
| `created_at` | Timestamp | Auto |

**Timer Mode Implementation**:
- User clicks "Start" on a task. Frontend stores `{task_id, start_time}` in Zustand state and Upstash Redis (resilience against browser crash).
- Real-time counter displayed in the app header (persists across page navigation via layout component).
- User clicks "Stop" to end. Duration calculated. Time entry created via API.
- If duration > 8 hours, prompt user for correction.
- If user starts a new timer while one is running, the previous timer is auto-stopped.
- Timer state synced to Redis so it survives page refresh.

**Manual Mode**: User selects task, enters date, start/end time (or just duration), description. Flagged as `source: manual` in reports.

**Timesheet Mode**: Weekly grid view — rows are tasks, columns are days (Mon-Sun). Users fill in hours per cell. Grid auto-calculates daily and weekly totals. Flags if daily total > 10 hours (configurable warning threshold).

**Data Flow on Time Entry Save**:
- Event published: `Time.Logged` with payload `{time_entry_id, task_id, user_id, duration_minutes, billable, hourly_rate, contact_id, deal_id}`.
- **ERP subscriber**: If `billable` is true, creates accrual journal entry: DR Unbilled Revenue (asset), CR Service Revenue (revenue), for `(duration_hours × hourly_rate)`.
- **CRM subscriber**: If `contact_id` exists, updates contact activity timeline: "[User] logged [duration] on [task title]". Aggregates total hours and billable value on contact record.
- **Reports subscriber**: Aggregates by user (productivity), task (efficiency), project (cost), contact (profitability).

### 4.6 Task Dependencies

**Table: `task.task_dependencies`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `task_id` | UUID | FK → `task.tasks.id` (the dependent task) |
| `depends_on_task_id` | UUID | FK → `task.tasks.id` (the blocking task) |
| `dependency_type` | Enum | `finish_to_start`, `start_to_start`, `finish_to_finish`, `start_to_finish` |
| `created_at` | Timestamp | Auto |

Used in Gantt view to draw dependency lines and calculate critical path. When a dependency task's dates change, auto-recalculate dependent task dates.

### 4.7 Views

All views read from the same `task.tasks` table. Switching views never loses data.

**Kanban Board**:
- Columns = status stages (configurable order per project).
- Cards show: title, assignee avatar, priority colour indicator, due date, tags, progress bar (checklist completion %).
- Drag-and-drop between columns triggers status transition (and all associated lifecycle events).
- WIP (Work In Progress) limits per column (configurable, default: no limit).
- Swimlanes: group by assignee, project, priority, or tag.
- Filter bar: multi-criteria filtering (status, assignee, priority, tags, date range).
- Implementation: React DnD Kit + optimistic UI updates + Supabase Realtime for multi-user sync.

**List View**:
- Rows = tasks. Columns = configurable (any task field).
- Sorting by any column. Multi-level grouping (e.g., group by project → status).
- Inline editing (click cell to edit).
- Bulk selection with batch actions (change status, reassign, set priority).
- Column resizing and reordering (preferences saved per user in `users_profile.notification_prefs` JSONB under a `view_prefs` key).
- Export to CSV.
- Implementation: TanStack Table with virtualisation for large datasets.

**Gantt/Timeline View**:
- Tasks as horizontal bars on a time axis (start_date to due_date).
- Dependency lines connecting related tasks.
- Critical path highlighted in red.
- Drag to resize changes dates. Drag to connect creates dependencies.
- Milestones shown as diamond markers.
- Zoom levels: day, week, month, quarter.
- Implementation: Custom SVG rendering or a library like `frappe-gantt` adapted for React.

**Calendar View**:
- Tasks mapped to due dates on month/week/day calendar.
- Colour coded by priority, status, or project.
- Drag-and-drop reschedules tasks (updates `due_date`).
- Google Calendar bidirectional sync: task due dates appear as calendar events, calendar events can be linked to tasks.
- Implementation: FullCalendar React wrapper or custom build with `date-fns`.

**Workload View**:
- Each team member = one row. Columns = time periods (days or weeks).
- Capacity bars: assigned hours (from `time_estimate_minutes` on tasks) vs available hours (from `available_hours_weekly` on membership).
- Colour coding: red (over-capacity), blue (under-capacity), green (optimal).
- Click a bar to see specific tasks contributing to that period's load.
- Data feeds into ERP Resource Utilisation Report.

**My Tasks / Today View**:
- Personal view for logged-in user.
- Sections: Overdue (red), Due Today (amber), Due This Week (normal), No Due Date (grey).
- One-click time tracker access.
- Default view for Member role.

**Summary Dashboard**:
- Customisable widget dashboard (drag-and-drop layout, saved per user).
- Widgets: Task completion rate (pie), Tasks by status (bar), Overdue count (drill-down), Team velocity (line over time), Burndown chart (for sprints), Recent activity (list), Upcoming deadlines (list).
- Default view for Manager and Owner roles.
- Implementation: Recharts or Tremor for charts. Grid layout with react-grid-layout.

### 4.8 Project Templates

**Table: `task.project_templates`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(255) | Template name |
| `description` | Text | What this template is for |
| `template_data` | JSONB | Serialised project structure: tasks, dependencies, checklists, default assignee roles |
| `created_by` | UUID | FK → users_profile |
| `created_at` | Timestamp | Auto |

When a project is created from a template, all tasks defined in `template_data` are created with relative dates (e.g., "due: +7 days from project start"). Used for auto-project creation from CRM pipeline stage changes.

---

## 5. Module 2: CRM (Ringmaker)

### 5.1 Overview

Manages all external relationships. The defining feature is the Universal Inbox powered by Unipile, which makes client communication a first-class operation within the system.

### 5.2 Company Entity

**Table: `crm.companies`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK, RLS scoping |
| `name` | String(255) | Company name |
| `domain` | String(255) | Website domain |
| `industry` | String(100) | Industry category |
| `size` | Enum | `1-10`, `11-50`, `51-200`, `201-500`, `500+` |
| `address` | JSONB | `{line1, line2, city, state, postcode, country}` |
| `phone` | String(20) | Main phone number |
| `website` | String | Full URL |
| `notes` | Text | General notes |
| `custom_fields` | JSONB | User-defined fields |
| `created_at` | Timestamp | Auto |
| `updated_at` | Timestamp | Auto |

### 5.3 Contact Entity

**Table: `crm.contacts`**

| Field | Type | Description | Sends Data To | Receives Data From |
|-------|------|-------------|--------------|-------------------|
| `id` | UUID | PK | Task Mgmt (linked tasks), ERP (AR) | Auto-generated |
| `organisation_id` | UUID | FK, RLS scoping | — | Auth context |
| `first_name` | String(100) | Contact first name | Notifications, Templates | User input, Import |
| `last_name` | String(100) | Contact last name | Notifications, Templates | User input, Import |
| `email` | String(255) | Primary email address | Universal Inbox, Email send | User input, Unipile sync |
| `phone` | String(20) | Phone / WhatsApp number | Universal Inbox, WhatsApp send | User input, Unipile sync |
| `company_id` | UUID | FK → `crm.companies.id`, Nullable | Reports, Grouping | User selection |
| `pipeline_id` | UUID | FK → `crm.pipelines.id` | Kanban view | User selection |
| `pipeline_stage_id` | UUID | FK → `crm.pipeline_stages.id` | Kanban view, Reports, Automation | User action, Automation |
| `deal_value` | Decimal(12,2) | Expected deal amount | ERP (forecast), Reports | User input |
| `owner_id` | UUID | FK → `users_profile.id` | Inbox routing, Permissions | User selection, Round-robin |
| `lead_source` | String(100) | Where lead came from | Source analysis reports | User input, Form, Ad |
| `lead_score` | Integer | Calculated qualification score | Prioritisation, Automation | Scoring engine |
| `department_owner` | Enum | `leads`, `outreach`, `closers` | Permission scoping | Pipeline stage, Manual |
| `tags` | Text[] | Flexible categorisation | Filtering, Reports, Sequences | User input |
| `custom_fields` | JSONB | Industry-specific fields | Reports, ERP mapping | User input |
| `last_contact_date` | Timestamp | Last message sent or received | Stale lead detection | Auto-updated on message |
| `total_hours_spent` | Decimal(8,2) | Aggregated from time entries on linked tasks | Client profitability | Auto-calculated |
| `total_billable_value` | Decimal(12,2) | Aggregated billable amount | Client profitability | Auto-calculated |
| `created_at` | Timestamp | Auto | Reports | Auto |
| `updated_at` | Timestamp | Auto | — | Auto |

### 5.4 Pipeline Entity

**Table: `crm.pipelines`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(255) | Pipeline name (e.g., "New Business", "Renewals") |
| `description` | Text | Purpose of this pipeline |
| `is_default` | Boolean | Default pipeline for new contacts |
| `created_at` | Timestamp | Auto |

**Table: `crm.pipeline_stages`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `pipeline_id` | UUID | FK → `crm.pipelines.id` |
| `name` | String(100) | Stage name (e.g., "Lead", "Prospect", "Qualified") |
| `colour` | String(7) | Hex colour |
| `position` | Integer | Order in pipeline |
| `probability` | Integer | Win probability percentage (0-100) for revenue forecast |
| `entry_conditions` | JSONB | Criteria that must be met to enter this stage |
| `exit_conditions` | JSONB | Criteria that must be met to leave this stage |
| `department_owner` | Enum | `leads`, `outreach`, `closers` — which department owns this stage |
| `project_template_id` | UUID | FK → `task.project_templates.id`, Nullable — auto-create project on entry |
| `created_at` | Timestamp | Auto |

Multiple pipelines per organisation. A contact exists in only one pipeline at a time but can be moved between pipelines.

**Pipeline → Task Management**: When a contact moves to a new stage with a `project_template_id`, auto-create a project from that template with the contact linked.

**Pipeline → ERP**: Stage changes with financial implications trigger ERP events. Moving to "Won" triggers invoice creation (DR Accounts Receivable, CR Revenue). Moving to "Lost" may trigger write-off. Pipeline value at each stage feeds into ERP revenue forecast: `deal_value × (probability / 100)`.

### 5.5 Universal Inbox

The Universal Inbox is the CRM's defining feature. It consolidates all client communication channels into a single interface powered by Unipile.

**Table: `crm.messages`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK, RLS scoping |
| `contact_id` | UUID | FK → `crm.contacts.id`, Nullable (unmatched messages go to "Unassigned") |
| `unipile_chat_id` | String | Unipile's conversation identifier |
| `unipile_message_id` | String | Unipile's message identifier |
| `channel` | Enum | `whatsapp`, `email`, `linkedin`, `instagram`, `telegram`, `messenger` |
| `direction` | Enum | `inbound`, `outbound` |
| `sender_identifier` | String | Phone number / email / profile URL |
| `sender_name` | String(255) | Display name |
| `subject` | String(500) | Email subject line, Nullable |
| `body` | Text | Message content |
| `body_html` | Text | HTML body for emails, Nullable |
| `attachments` | JSONB | Array of `{filename, url, mime_type, size_bytes}` |
| `thread_id` | String | Email thread ID for threading, Nullable |
| `cc` | Text[] | Email CC addresses, Nullable |
| `bcc` | Text[] | Email BCC addresses, Nullable |
| `sent_by_user_id` | UUID | FK → `users_profile.id`, Nullable (null for inbound) |
| `read` | Boolean | Has the assigned owner read this message? |
| `timestamp` | Timestamp | When message was sent/received |
| `created_at` | Timestamp | Auto |

**Message Receiving (Inbound)**:
1. Unipile delivers incoming message via webhook to Next.js API route `/api/webhooks/unipile`.
2. Webhook payload: `{provider, sender_identifier, message_body, attachments[], timestamp, chat_id}`.
3. Edge Function or API route processes:
   a. Match `sender_identifier` against existing contacts (email or phone).
   b. If match found: create `crm.messages` record linked to contact. Appears in assigned owner's inbox.
   c. If no match: message appears in "Unassigned" inbox for manual matching or new contact creation.
4. Event published: `Message.Received` with payload `{message_id, contact_id, channel, sender}`.

**Message Sending (Outbound)**:
1. User composes message in Universal Inbox UI, selects channel, clicks Send.
2. API route calls Unipile: `POST /chats/{chat_id}/messages` (existing conversation) or `POST /chats` (new conversation).
3. Message logged to `crm.messages` with `direction: outbound`, `sent_by_user_id`.
4. Contact's `last_contact_date` updated.
5. Event published: `Message.Sent` with payload `{message_id, contact_id, channel, user_id}`.

**Task Creation from Messages**:
1. User selects one or more messages in a conversation thread.
2. Clicks "Create Task" button.
3. Task Creation modal opens pre-populated with: `description` (selected message texts with sender names and timestamps), `contact_id` (current contact), `deal_id` (if contact has active deal).
4. User adds: title, assignee, priority, due date.
5. On submit: task created in `task.tasks`. Event published: `Task.CreatedFromCRM` with payload `{task_id, contact_id, message_ids[]}`.
6. Both Task Management and CRM store cross-references.

**Auto-Pipeline Updates** (configurable automation rules):
- First outbound message to Prospect → auto-move to Outreach stage.
- First inbound reply from Outreach → auto-move to Engaged stage.
- Outbound email with attachment tagged "proposal" → auto-move to Proposal stage.
- Each auto-update publishes `Pipeline.StageChanged` event.

### 5.6 Cross-Department Visibility

Three departments: Leads, Outreach, Closers. Each contact has a `department_owner` field determining edit rights.

**Comment System**:

**Table: `crm.contact_comments`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `contact_id` | UUID | FK → `crm.contacts.id` |
| `user_id` | UUID | FK → `users_profile.id` |
| `body` | Text | Comment text, supports @mentions |
| `mentions` | UUID[] | Array of mentioned user IDs |
| `created_at` | Timestamp | Auto |

- Comments visible to all departments (internal only, never visible to external contact).
- @mentions trigger notifications.
- Comments cannot be edited after 15 minutes (audit trail).

**Lead Folder Handoff**:

**Table: `crm.lead_folders`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(255) | Folder name |
| `description` | Text | Notes about this lead batch |
| `contact_ids` | UUID[] | Array of contact IDs in this folder |
| `from_department` | Enum | `leads`, `outreach`, `closers` |
| `to_department` | Enum | `leads`, `outreach`, `closers` |
| `submitted_by` | UUID | FK → `users_profile.id` |
| `status` | Enum | `pending`, `in_progress`, `completed` |
| `notes` | Text | Additional context |
| `submitted_at` | Timestamp | Auto |

Bidirectional link: submitting department sees folder status; receiving department sees source context. Event published: `LeadFolder.Submitted`.

### 5.7 Deal Entity

**Table: `crm.deals`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `contact_id` | UUID | FK → `crm.contacts.id` |
| `pipeline_id` | UUID | FK → `crm.pipelines.id` |
| `stage_id` | UUID | FK → `crm.pipeline_stages.id` |
| `name` | String(255) | Deal name |
| `value` | Decimal(12,2) | Deal value |
| `currency` | String(3) | ISO currency code |
| `expected_close_date` | Date | Nullable |
| `owner_id` | UUID | FK → `users_profile.id` |
| `loss_reason` | Text | Nullable, captured when deal is lost |
| `won_at` | Timestamp | Nullable |
| `lost_at` | Timestamp | Nullable |
| `line_items` | JSONB | Array of `{description, quantity, unit_price, total}` |
| `payment_terms` | String | e.g., "Net 30" |
| `custom_fields` | JSONB | User-defined |
| `created_at` | Timestamp | Auto |
| `updated_at` | Timestamp | Auto |

---

## 6. Module 3: ERP (Rainmaker)

### 6.1 Overview

The financial backbone. Captures every financial transaction, maintains the general ledger, manages assets, and produces financial statements.

### 6.2 Chart of Accounts

**Table: `erp.chart_of_accounts`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `code` | String(20) | Account code (e.g., "1001", "2001") |
| `name` | String(255) | Account name (e.g., "Cash in Bank", "Accounts Receivable") |
| `type` | Enum | `asset`, `liability`, `equity`, `revenue`, `expense` |
| `sub_type` | String(100) | Subcategory (e.g., "current_asset", "fixed_asset") |
| `parent_id` | UUID | FK → self, Nullable (for hierarchical chart) |
| `is_system` | Boolean | System-generated accounts cannot be deleted |
| `is_active` | Boolean | Inactive accounts cannot receive new entries |
| `description` | Text | What this account is for |
| `normal_balance` | Enum | `debit`, `credit` |
| `created_at` | Timestamp | Auto |

**Default Chart of Accounts** (seeded on organisation creation):

Assets: Cash in Bank (1001), Accounts Receivable (1010), Unbilled Revenue (1020), Fixed Assets (1100), Accumulated Depreciation (1101, contra-asset).

Liabilities: Accounts Payable (2001), Accrued Liabilities (2010), Payroll Liabilities (2020).

Equity: Owner's Equity (3001), Retained Earnings (3010).

Revenue: Service Revenue (4001), Sales Revenue (4010).

Expenses: Salary Expense (5001), Depreciation Expense (5010), Office Expense (5020), Travel Expense (5030), General Expense (5040).

### 6.3 Journal Entry Engine

**Table: `erp.journal_entries`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `date` | Date | Entry date |
| `description` | String(500) | Human-readable explanation |
| `source_module` | Enum | `task_management`, `crm`, `erp`, `manual` |
| `source_event_id` | UUID | UNIQUE — FK to `shared.events.event_id`, prevents duplicate postings |
| `status` | Enum | `draft`, `posted`, `voided` |
| `created_by` | UUID | FK → `users_profile.id` |
| `period_id` | UUID | FK → `erp.accounting_periods.id` |
| `created_at` | Timestamp | Auto |

**Table: `erp.journal_entry_lines`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `journal_entry_id` | UUID | FK → `erp.journal_entries.id` |
| `account_id` | UUID | FK → `erp.chart_of_accounts.id` |
| `debit_amount` | Decimal(12,2) | Default: 0.00 |
| `credit_amount` | Decimal(12,2) | Default: 0.00 |
| `cost_centre_id` | UUID | FK → `erp.cost_centres.id`, Nullable |
| `contact_id` | UUID | FK → `crm.contacts.id`, Nullable (for client-related entries) |
| `description` | String(255) | Line-level note |

**Validation Rules** (enforced by database constraint + API validation):
1. Total debits must equal total credits (database CHECK constraint on the entry).
2. Every line must reference a valid, active account.
3. Entry date must be within an open accounting period (closed periods reject new entries).
4. `source_event_id` must be unique (UNIQUE constraint prevents duplicate postings from replayed events).

**Auto-Generation Event Mappings** (configurable by Admin):

| Event | Debit Account | Credit Account |
|-------|--------------|---------------|
| `Time.Logged` (billable=true) | Unbilled Revenue (1020) | Service Revenue (4001) |
| `Deal.Won` | Accounts Receivable (1010) | Sales Revenue (4010) |
| `Payment.Received` | Cash in Bank (1001) | Accounts Receivable (1010) |
| `Asset.Purchased` | Fixed Assets (1100) | Cash in Bank (1001) or Accounts Payable (2001) |
| `Salary.Paid` | Salary Expense (5001) | Cash in Bank (1001) |
| `Expense.Approved` | [Expense category account] | Accounts Payable (2001) or Cash in Bank (1001) |
| `Depreciation.Monthly` | Depreciation Expense (5010) | Accumulated Depreciation (1101) |

### 6.4 Accounting Periods

**Table: `erp.accounting_periods`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(100) | e.g., "March 2026" |
| `start_date` | Date | Period start |
| `end_date` | Date | Period end |
| `status` | Enum | `open`, `closed`, `locked` |
| `closed_by` | UUID | FK, Nullable |
| `closed_at` | Timestamp | Nullable |

### 6.5 Invoicing

**Table: `erp.invoices`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `invoice_number` | String(50) | Sequential, org-specific (e.g., "INV-0001") |
| `contact_id` | UUID | FK → `crm.contacts.id` |
| `deal_id` | UUID | FK → `crm.deals.id`, Nullable |
| `date` | Date | Invoice date |
| `due_date` | Date | Payment due date |
| `status` | Enum | `draft`, `sent`, `paid`, `partially_paid`, `overdue`, `voided` |
| `subtotal` | Decimal(12,2) | Sum of line items |
| `tax_amount` | Decimal(12,2) | Calculated tax |
| `total` | Decimal(12,2) | Subtotal + tax |
| `amount_paid` | Decimal(12,2) | Total payments received |
| `currency` | String(3) | ISO currency code |
| `notes` | Text | Invoice notes |
| `payment_terms` | String | e.g., "Net 30" |
| `line_items` | JSONB | Array of `{description, quantity, unit_price, tax_rate, total}` |
| `journal_entry_id` | UUID | FK → `erp.journal_entries.id` (the AR entry) |
| `created_at` | Timestamp | Auto |

**Table: `erp.payments`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `invoice_id` | UUID | FK → `erp.invoices.id` |
| `contact_id` | UUID | FK → `crm.contacts.id` |
| `amount` | Decimal(12,2) | Payment amount |
| `date` | Date | Payment date |
| `method` | Enum | `bank_transfer`, `card`, `cash`, `cheque`, `other` |
| `reference` | String(100) | Transaction reference |
| `journal_entry_id` | UUID | FK → `erp.journal_entries.id` |
| `created_at` | Timestamp | Auto |

### 6.6 Asset Register

**Table: `erp.assets`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(255) | e.g., "MacBook Pro 16-inch" |
| `category_id` | UUID | FK → `erp.asset_categories.id` |
| `serial_number` | String(100) | Nullable |
| `tag_number` | String(50) | Internal tracking number |
| `purchase_date` | Date | When purchased |
| `purchase_price` | Decimal(12,2) | Original cost |
| `supplier` | String(255) | Vendor name |
| `useful_life_months` | Integer | Expected useful life |
| `depreciation_method` | Enum | `straight_line`, `declining_balance`, `units_of_production` |
| `salvage_value` | Decimal(12,2) | Residual value at end of life |
| `current_book_value` | Decimal(12,2) | Calculated: purchase_price - accumulated_depreciation |
| `accumulated_depreciation` | Decimal(12,2) | Running total of depreciation |
| `assigned_to_user_id` | UUID | FK, Nullable |
| `department_id` | String(100) | Nullable |
| `location` | String(255) | Physical location |
| `condition` | Enum | `new`, `good`, `fair`, `needs_repair`, `out_of_service`, `disposed` |
| `warranty_expiry_date` | Date | Nullable |
| `notes` | Text | Nullable |
| `custom_fields` | JSONB | User-defined |
| `disposed_at` | Timestamp | Nullable |
| `disposal_method` | Enum | `sold`, `written_off`, `donated`, Nullable |
| `disposal_price` | Decimal(12,2) | Nullable |
| `created_at` | Timestamp | Auto |

**Depreciation Scheduling**: On asset registration, system calculates monthly depreciation and creates a recurring schedule. A Supabase cron job (pg_cron) fires monthly, generating journal entries: DR Depreciation Expense, CR Accumulated Depreciation. Updates `current_book_value`.

**Asset Assignment History**:

**Table: `erp.asset_assignments`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `asset_id` | UUID | FK → `erp.assets.id` |
| `previous_user_id` | UUID | Nullable |
| `new_user_id` | UUID | Nullable |
| `assigned_at` | Timestamp | When assignment changed |
| `notes` | Text | Nullable |

### 6.7 Expense Management

**Table: `erp.expenses`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `user_id` | UUID | FK → `users_profile.id` (who submitted) |
| `category` | String(100) | Expense category (maps to chart of accounts) |
| `amount` | Decimal(12,2) | Expense amount |
| `currency` | String(3) | ISO code |
| `date` | Date | Expense date |
| `description` | Text | What was purchased |
| `receipt_url` | String | Supabase Storage URL |
| `contact_id` | UUID | FK, Nullable (client-related expense) |
| `cost_centre_id` | UUID | FK, Nullable |
| `status` | Enum | `submitted`, `approved`, `rejected`, `paid` |
| `approved_by` | UUID | FK, Nullable |
| `approved_at` | Timestamp | Nullable |
| `rejection_reason` | Text | Nullable |
| `journal_entry_id` | UUID | FK, Nullable (created on approval) |
| `created_at` | Timestamp | Auto |

### 6.8 Cost Centres

**Table: `erp.cost_centres`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(255) | e.g., "Engineering", "Sales", "Client: Acme Corp" |
| `code` | String(20) | Short code |
| `parent_id` | UUID | FK → self, Nullable (hierarchical) |
| `is_active` | Boolean | Default: true |
| `created_at` | Timestamp | Auto |

---

## 7. Cross-Module Data Flows (Event Registry)

Every data flow between modules is documented here. Each flow describes the trigger, payload, and receiving action.

| ID | Event | From → To | Trigger | Payload | Receiving Action |
|----|-------|-----------|---------|---------|-----------------|
| F-001 | `Task.Created` | Task → CRM | Task created with `contact_id` | `{task_id, title, assignee, status, due_date, contact_id}` | CRM adds task to contact's `linked_tasks`; timeline: "New task created" |
| F-002 | `Task.StatusChanged` | Task → CRM | Task status changes, has `contact_id` | `{task_id, old_status, new_status, timestamp}` | CRM updates task status on contact panel; timeline shows change |
| F-003 | `Task.Completed` | Task → CRM + ERP | Always | `{task_id, total_time, billable_time, contact_id, deal_id, completed_at}` | CRM: timeline + notify owner. ERP: if billable, create billing entry |
| F-004 | `Time.Logged` | Task → ERP + CRM + Reports | Always | `{time_entry_id, task_id, user_id, duration, billable, rate, contact_id}` | ERP: accrue revenue. CRM: activity timeline. Reports: aggregate |
| F-005 | `Task.Blocked` | Task → Notifications | Always | `{task_id, blocking_task_id, reason, assigned_to}` | Notify manager if blocked > threshold. Dashboard counter |
| F-006 | `Deal.StageChanged` | CRM → ERP + Task | Always | `{deal_id, contact_id, old_stage, new_stage, deal_value}` | ERP: update forecast. Task: auto-create project if template mapped |
| F-007 | `Deal.Won` | CRM → ERP + Task | Deal closes | `{deal_id, contact_id, deal_value, line_items, payment_terms}` | ERP: create invoice + AR. Task: create onboarding project if template |
| F-008 | `Deal.Lost` | CRM → ERP + Reports | Deal lost | `{deal_id, contact_id, loss_reason, deal_value}` | ERP: write off pre-invested costs. Reports: loss analysis |
| F-009 | `Message.Received` | Unipile → CRM | Inbound message | `{sender_id, channel, body, attachments, timestamp}` | CRM: log to timeline. Automation: trigger stage change if configured |
| F-010 | `Message.Sent` | CRM → CRM | Outbound message | `{recipient_id, channel, body, timestamp, user_id}` | CRM: log to timeline, update `last_contact_date`. Auto-stage |
| F-011 | `Invoice.Created` | ERP → CRM | Invoice generated | `{invoice_id, contact_id, amount, due_date}` | CRM: show invoice on contact record |
| F-012 | `Payment.Received` | ERP → CRM | Payment recorded | `{payment_id, invoice_id, contact_id, amount}` | CRM: timeline. ERP: settle AR (DR Bank, CR AR) |
| F-013 | `Asset.Purchased` | ERP → ERP | Asset registered | `{asset_id, purchase_price, account_debited}` | Journal entry (DR Asset, CR Bank/AP). Start depreciation |
| F-014 | `Asset.Assigned` | ERP → Notifications | Assignment change | `{asset_id, user_id, previous_user_id}` | Notify new assignee. Update user profile |
| F-015 | `Depreciation.Monthly` | ERP cron → ERP | Monthly schedule | `{asset_id, depreciation_amount}` | Journal entry (DR Dep Exp, CR Accum Dep). Update book value |
| F-016 | `Expense.Submitted` | ERP → Notifications | Expense claim | `{expense_id, user_id, amount, category, receipt_url}` | Notify approving manager. Pending queue |
| F-017 | `Expense.Approved` | ERP → ERP | Manager approval | `{expense_id, approved_by, amount}` | Journal entry (DR Expense, CR AP/Bank) |
| F-018 | `Salary.Paid` | ERP → ERP + Reports | Payroll entry | `{user_id, amount, period}` | Journal entry (DR Salary Exp, CR Bank). Employee ROI calc |
| F-019 | `User.Created` | Auth → All | New user added | `{user_id, name, email, role, department}` | All modules: user available for assignment |
| F-020 | `LeadFolder.Submitted` | CRM → CRM + Notifications | Dept handoff | `{folder_id, contact_ids[], from_dept, to_dept}` | Receiving dept gets folder. Notification to dept lead |

---

## 8. Shared Services

### 8.1 Notification Service

**Table: `shared.notifications`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `user_id` | UUID | FK → recipient |
| `event_type` | String | e.g., `Task.Assigned`, `Deal.Won` |
| `title` | String(255) | Human-readable title |
| `body` | Text | Description |
| `source_module` | String | `task`, `crm`, `erp` |
| `deep_link` | String | URL path to the relevant record |
| `actor_id` | UUID | Who triggered the event |
| `read` | Boolean | Default: false |
| `channels_delivered` | Text[] | Which channels it was sent through |
| `created_at` | Timestamp | Auto |

Three delivery channels: in-app (bell icon with unread count, Supabase Realtime subscription), email (Resend, configurable per event type), push (future mobile app). Supports batching (daily digest email) and quiet hours (suppress non-urgent outside working hours). Notifications stored 90 days.

### 8.2 Automation Engine

**Table: `shared.automation_rules`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `name` | String(255) | Rule name |
| `description` | Text | What this rule does |
| `trigger_event` | String | Event type that fires this rule |
| `trigger_schedule` | String | Cron expression for time-based triggers, Nullable |
| `conditions` | JSONB | Filter conditions on event payload |
| `actions` | JSONB | Array of `{action_type, params}` to execute |
| `is_active` | Boolean | Default: true |
| `created_by` | UUID | FK |
| `last_triggered_at` | Timestamp | Nullable |
| `trigger_count` | Integer | Default: 0 |
| `created_at` | Timestamp | Auto |

**Example Cross-Module Rules:**
- `Deal.Won` AND `deal_value > 5000` → Create project from "Premium Onboarding" template + create invoice + send congratulations via Universal Inbox.
- `Task.Blocked` for > 48 hours → Change priority to Critical + notify manager + add CRM comment.
- `Time.Logged` AND user weekly hours > 40 → Notify manager with workload warning.
- `Payment.Received` AND invoice fully paid → Update CRM deal to "Paid" + send thank-you message.
- `Contact.NoActivity` for 7 days AND stage is "Outreach" → Send follow-up email + alert CRM rep.

### 8.3 Reporting Engine

Cross-module reports that no standalone tool can generate:

**Employee ROI Report**: Sources: ERP (salary cost), Task Mgmt (hours worked, billable hours, tasks completed), CRM (revenue from deals linked to employee tasks). Formula: `(Billable Revenue - Total Employee Cost) / Total Employee Cost`. Output: name, role, department, salary cost, total hours, billable hours, billable %, revenue attributed, ROI %, trend over time.

**Client Profitability Report**: Sources: CRM (deal value, communication volume), Task Mgmt (hours on client tasks, billable hours), ERP (expenses, invoices, payments). Formula: `(Total Revenue - Total Cost to Serve) / Total Revenue`. Output: client name, total revenue, total cost (labour + expenses), profit margin, hours consumed, average task completion time, communication volume.

**Organisational Health Dashboard**: Widgets: Cash position (ERP bank balances), Monthly revenue (income statement), Pipeline value (CRM weighted forecast), Team utilisation (Task workload data), Overdue tasks, Overdue invoices (AR ageing), Asset value, Employee count and cost.

**Financial Statements**: Generated from General Ledger. Balance Sheet, Income Statement, Cash Flow Statement, Trial Balance. Exportable to PDF and Excel. Filterable by date range, cost centre, department.

### 8.4 Integration Layer

**REST API**: Every entity accessible via RESTful API routes in Next.js. Auth via API keys or OAuth2 tokens. Rate limited (Upstash Redis). Supports filtering, pagination, sorting, field selection. JSON payloads.

**Webhooks**: External systems subscribe to Rainmaker events. HTTP POST to configured URL with event payload. Retry logic (3 attempts with exponential backoff).

**Table: `shared.webhook_subscriptions`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `url` | String | Target URL |
| `event_types` | Text[] | Which events to send |
| `secret` | String | HMAC signing secret |
| `is_active` | Boolean | Default: true |
| `created_at` | Timestamp | Auto |

**Unipile Integration**: Primary external integration for multi-channel messaging. Connected via REST API and webhook delivery. Account auth via Unipile's hosted auth flow.

**Google Workspace**: Calendar sync (bidirectional — task due dates ↔ calendar events), Drive file linking (attach Drive files to tasks/contacts), Sheets export (task lists and reports).

### 8.5 Global Search

Full-text search across all modules using PostgreSQL `tsvector` indexes initially:
- Tasks: title + description
- Contacts: first_name + last_name + email + company name
- Deals: name
- Messages: body
- Assets: name + serial_number

Search results grouped by module. Deep links to each result. Permission-aware: users only see results they have access to (RLS enforced).

Future: Elasticsearch for more advanced search (fuzzy matching, faceted search, search-as-you-type).

### 8.6 Audit Log

**Table: `shared.audit_log`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `organisation_id` | UUID | FK |
| `user_id` | UUID | FK — who performed the action |
| `action` | String | `create`, `update`, `delete`, `login`, `export` |
| `entity_type` | String | `task`, `contact`, `deal`, `journal_entry`, etc. |
| `entity_id` | UUID | The record that was affected |
| `changes` | JSONB | `{field: {old_value, new_value}}` for updates |
| `ip_address` | String | Nullable |
| `user_agent` | String | Nullable |
| `created_at` | Timestamp | Auto |

Immutable (no updates or deletes). Retained for minimum 7 years. Queryable by Admin for compliance audits.

---

## 9. UI/UX Architecture

### 9.1 App Shell Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar: Org Switcher | Global Search | Timer | Notifications | Profile │
├──────┬──────────────────────────────────────────────────────┤
│      │                                                      │
│  S   │              Main Content Area                       │
│  i   │                                                      │
│  d   │  (Module-specific views render here)                 │
│  e   │                                                      │
│  b   │                                                      │
│  a   │                                                      │
│  r   │                                                      │
│      │                                                      │
│  N   │                                                      │
│  a   │                                                      │
│  v   │                                                      │
│      │                                                      │
├──────┴──────────────────────────────────────────────────────┤
│  (Optional) Command Palette (Cmd+K)                         │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar Navigation**:
- Dashboard (home)
- Tasks (Kanban, List, Gantt, Calendar, My Tasks)
- CRM (Contacts, Pipeline, Universal Inbox, Companies, Deals)
- ERP (Chart of Accounts, Journal Entries, Invoices, Expenses, Assets, Reports)
- Reports (Employee ROI, Client Profitability, Org Health)
- Settings (Organisation, Users, Automations, Integrations)
- Sidebar items filtered by user role.

**Global Elements**:
- Organisation switcher in top-left corner.
- Global search bar (Cmd+K) with results across all modules.
- Active timer display in top bar (persists across pages).
- Notification bell with unread count.
- User avatar with profile/settings/logout dropdown.

### 9.2 Responsive Design

- Desktop: Full sidebar + main content.
- Tablet: Collapsible sidebar (hamburger menu).
- Mobile: Bottom navigation bar with module icons. Full-screen views. Native-feeling interactions.
- All built with Tailwind CSS responsive utilities and shadcn/ui components.

### 9.3 Command Palette

Cmd+K opens a command palette (similar to Linear, Notion). Actions: navigate to any page, create task/contact/deal/expense, search globally, switch organisation, toggle timer. Implemented with shadcn/ui `Command` component (built on cmdk).

---

## 10. Development Phasing

### Phase 1: Foundation (Weeks 1-6)

**Deliverable**: Functional task management tool.

1. Supabase project setup (database, auth, storage, RLS policies).
2. Next.js app scaffold (App Router, TypeScript, Tailwind, shadcn/ui).
3. Authentication (email/password, OAuth Google/Microsoft, session management).
4. Organisation and workspace CRUD.
5. User invitation system.
6. RBAC middleware and `usePermissions()` hook.
7. Task CRUD with full entity fields.
8. Task lifecycle (status transitions, event publishing).
9. Kanban board view (drag-and-drop, WIP limits, filters).
10. List view (sortable, groupable, inline editing, bulk actions).
11. Basic time tracking (timer mode, manual mode).
12. My Tasks / Today view.
13. Project CRUD and project-task relationship.
14. Event Bus infrastructure (events table, database triggers, Realtime subscriptions).
15. Basic notification service (in-app only).
16. Global search (PostgreSQL full-text).
17. App shell layout (sidebar, top bar, responsive).

### Phase 2: CRM Core (Weeks 7-12)

**Deliverable**: CRM with Universal Inbox and first cross-module integration.

18. Contact and Company CRUD with full entity fields.
19. Pipeline and pipeline stages CRUD.
20. Pipeline Kanban view (drag-and-drop stage changes).
21. Unipile integration setup (OAuth flow, webhook endpoint).
22. Universal Inbox — message receiving (webhook processing, contact matching).
23. Universal Inbox — message sending (compose UI, Unipile API calls).
24. Universal Inbox — conversation threading and channel switching.
25. Task creation from inbox messages.
26. Contact activity timeline (messages, tasks, events).
27. Cross-module linking: tasks ↔ contacts ↔ deals.
28. Auto-pipeline updates from inbox activity.
29. Cross-department visibility (comments, @mentions).
30. Lead folder handoff system.
31. Deal entity CRUD.
32. Lead scoring engine (configurable rules, auto-calculated).
33. Contact import (CSV upload).

### Phase 3: ERP Foundation (Weeks 13-18)

**Deliverable**: Financial backbone with auto-journal entries.

34. Chart of Accounts CRUD with default seed data.
35. Accounting periods management.
36. Journal entry engine (manual creation, validation, posting).
37. Auto-journal entries from events (Time.Logged, Deal.Won, Payment.Received).
38. Event-to-account mapping configuration UI.
39. Cost centres CRUD.
40. Invoicing from CRM deals (auto-generation on Deal.Won).
41. Invoice CRUD (create, send, track status).
42. Payment recording and AR settlement.
43. Expense submission and approval workflow.
44. Basic financial reports (Trial Balance, simple P&L).
45. Cross-module event processing (ERP subscribes to Task and CRM events).

### Phase 4: Advanced Features (Weeks 19-24)

**Deliverable**: Full feature set with advanced views and reporting.

46. Asset register (CRUD, categories, serial tracking).
47. Depreciation scheduling (straight-line, declining balance, monthly cron).
48. Asset assignment tracking and history.
49. Timesheet mode (weekly grid view).
50. Gantt/Timeline view with dependencies.
51. Calendar view with Google Calendar sync.
52. Workload view (capacity vs assignment).
53. Automation engine (rule CRUD, trigger-condition-action processing).
54. Cross-module automation rules.
55. Employee ROI report.
56. Client Profitability report.
57. Organisational Health Dashboard.
58. Email sequences (multi-step automated email campaigns via Unipile).
59. Summary Dashboard with configurable widgets.
60. Webhook system for external integrations.

### Phase 5: Polish and Scale (Weeks 25-30)

**Deliverable**: Production-ready, optimised, fully featured.

61. Financial statements (Balance Sheet, Income Statement, Cash Flow).
62. Report export to PDF and Excel.
63. REST API with API key auth, rate limiting, documentation.
64. Advanced search (Elasticsearch integration or enhanced pg_trgm).
65. 2FA implementation (TOTP + SMS).
66. Audit log implementation.
67. Bank reconciliation.
68. Additional Unipile channels (LinkedIn, Instagram, Telegram).
69. Google Drive file linking.
70. Project templates and auto-project creation from pipeline.
71. Bulk actions across modules.
72. Performance optimisation (query tuning, caching strategy, edge rendering).
73. Security hardening (penetration testing, OWASP compliance, data encryption at rest).
74. Command palette (Cmd+K).
75. Mobile responsive optimisation.

---

## 11. Non-Functional Requirements

### 11.1 Performance

- Page load (initial): < 2 seconds on 4G connection.
- Page navigation (subsequent): < 500ms (SPA-like with Next.js App Router).
- API response time: < 200ms for CRUD operations, < 1 second for reports.
- Event Bus latency: < 500ms from event publish to subscriber processing.
- Real-time updates: < 100ms via Supabase Realtime WebSocket.
- Search results: < 300ms.

### 11.2 Security

- All data encrypted in transit (TLS 1.3 via Vercel).
- Database encryption at rest (Supabase managed).
- RLS policies on every table enforcing organisation-level data isolation.
- CSRF protection via Next.js built-in mechanisms.
- XSS prevention via React's default escaping + CSP headers.
- SQL injection prevention via Supabase client library (parameterised queries).
- Rate limiting on all API routes (Upstash Redis).
- Password hashing (bcrypt via Supabase Auth).
- JWT tokens with configurable expiry.
- Session revocation capability.
- Audit logging of all data mutations.
- OWASP Top 10 compliance.

### 11.3 Scalability

- Supabase handles database scaling (connection pooling via PgBouncer, read replicas).
- Vercel handles frontend scaling (edge network, serverless functions, auto-scaling).
- Redis caching for frequently accessed data (user sessions, active timers, dashboard aggregates).
- Database indexing strategy defined per entity.
- Pagination on all list endpoints (cursor-based for large datasets).

### 11.4 Data Integrity

- Foreign key constraints on all relationships.
- CHECK constraints on journal entries (debits = credits).
- UNIQUE constraints on `source_event_id` (no duplicate event processing).
- Soft deletes where appropriate (set `is_active = false` rather than DELETE).
- Immutable audit log.
- Database backups via Supabase (daily automated, point-in-time recovery).

### 11.5 Accessibility

- WCAG 2.1 AA compliance target.
- shadcn/ui and Radix UI provide accessible primitives.
- Keyboard navigation for all interactive elements.
- Screen reader support.
- Colour contrast ratios meeting AA standards.
- Focus management on modals and drawers.

---

## 12. Testing Strategy

- **Unit Tests**: Vitest for utility functions, data transformations, business logic.
- **Component Tests**: React Testing Library for UI components.
- **Integration Tests**: API route testing with Vitest + Supabase local dev.
- **E2E Tests**: Playwright for critical user flows (login, create task, move pipeline, create invoice).
- **Database Tests**: pgTAP for RLS policy verification and constraint testing.
- **Target**: 80% code coverage on business logic, 100% coverage on RLS policies.

---

## 13. Deployment and Infrastructure

- **Preview Deploys**: Every PR gets a Vercel preview URL with isolated Supabase branch (or shared staging).
- **Staging**: `staging.rainmaker.app` — mirrors production.
- **Production**: `app.rainmaker.app` — Vercel production deployment.
- **CI/CD**: GitHub Actions — lint, type-check, test, deploy.
- **Database Migrations**: Supabase CLI migrations (`supabase db push`, `supabase db diff`).
- **Environment Variables**: Managed via Vercel and Supabase dashboards. Secrets never in code.
- **Monitoring**: Vercel Analytics (performance), Sentry (errors), Supabase Dashboard (database health).

---

*End of PRD — Version 1.0*
