# Plan: Phase 2 — CRM (Ringmaker) Module

**TL;DR**: Build the full CRM module across 5 sub-phases (2A–2E). Starts with DB migration + types, then Contacts & Companies CRUD, Pipeline & Deals Kanban, Universal Inbox (Unipile), cross-module event integration, and lead scoring. Each sub-phase is independently verifiable. All UI follows the Rainmaker design system (Satoshi font, Orange/Jet/Moonstone palette, no shadows, `rounded-full` buttons, `rounded-xl` cards).

**Note**: shadcn MCP server is not currently connected — components will need to be installed via CLI (`npx shadcn@latest add ...`).

---

## Phase 2A — Contacts & Companies (Foundation)

### Step 1: CRM Database Migration (`0006_crm_schema.sql`)
*Start here, no dependencies.*

Create `crm` schema with 8 tables:

**Tables:**
- `crm.companies` — id, organisation_id, name, domain, industry, size (CHECK enum: 1-10/11-50/51-200/201-500/500+), address (JSONB), phone, website, notes, custom_fields (JSONB), is_active, created_at, updated_at
- `crm.contacts` — id, organisation_id, company_id (FK nullable), first_name, last_name, email, phone, pipeline_id (FK nullable), pipeline_stage_id (FK nullable), deal_value (decimal 12,2), owner_id (FK users_profile), lead_source, lead_score (int default 0), department_owner (CHECK: leads/outreach/closers), tags (text[]), custom_fields (JSONB), last_contact_date, total_hours_spent, total_billable_value, is_active, created_at, updated_at
- `crm.pipelines` — id, organisation_id, name, description, is_default (boolean), is_active, created_at, updated_at
- `crm.pipeline_stages` — id, pipeline_id (FK), name, colour (hex string), position (int), probability (int 0-100), entry_conditions (JSONB), exit_conditions (JSONB), department_owner (CHECK), project_template_id (FK nullable), sort_order, is_active, created_at, updated_at
- `crm.deals` — id, organisation_id, contact_id (FK), pipeline_id (FK), stage_id (FK pipeline_stages), name, value (decimal 12,2), currency (varchar 3 default 'GBP'), expected_close_date, owner_id (FK), loss_reason, won_at, lost_at, line_items (JSONB), payment_terms, custom_fields (JSONB), sort_order, is_active, created_at, updated_at
- `crm.messages` — id, organisation_id, contact_id (FK nullable), unipile_chat_id, unipile_message_id (UNIQUE), channel (CHECK: whatsapp/email/linkedin/instagram/telegram/messenger), direction (CHECK: inbound/outbound), sender_identifier, sender_name, subject, body, body_html, attachments (JSONB), thread_id, cc (text[]), bcc (text[]), sent_by_user_id (FK nullable), read (boolean default false), timestamp, created_at
- `crm.contact_comments` — id, contact_id (FK), user_id (FK), body, mentions (uuid[]), created_at
- `crm.lead_folders` — id, organisation_id, name, description, contact_ids (uuid[]), from_department (CHECK), to_department (CHECK), submitted_by (FK), status (CHECK: pending/in_progress/completed), notes, submitted_at

**For each table:**
- RLS enabled, policies scoped by `organisation_id` using `get_user_org_ids()` and `get_user_role()`
- `updated_at` trigger (reuse `public.set_updated_at()`)
- Indexes on: organisation_id, foreign keys, status fields, GIN on tags/custom_fields
- Full-text search index on contacts (first_name, last_name, email)
- Grant authenticated/anon access
- Enable Realtime on contacts, deals, messages

**Seed data:** Auto-create a default pipeline with 5 stages (Lead → Prospect → Proposal → Negotiation → Won) on org creation via trigger or extend onboarding action.

**Event triggers on CRM tables:**
- `trg_deal_stage_changed` — after update on deals when stage_id changes → publish `Deal.StageChanged`
- `trg_deal_won` — after update on deals when won_at set → publish `Deal.Won`
- `trg_deal_lost` — after update on deals when lost_at set → publish `Deal.Lost`
- `trg_message_received` — after insert on messages where direction='inbound' → publish `Message.Received`
- `trg_message_sent` — after insert on messages where direction='outbound' → publish `Message.Sent`
- `trg_lead_folder_submitted` — after insert on lead_folders → publish `LeadFolder.Submitted`

**Reference**: Follow patterns in `supabase/migrations/0003_task_schema.sql` and `supabase/migrations/0004_event_bus.sql`

---

### Step 2: CRM TypeScript Types (`src/types/crm.ts`)
*Parallel with Step 1.*

Define all types matching the DB schema:
- `Company`, `Contact`, `ContactWithCompany`, `ContactWithDetails`
- `Pipeline`, `PipelineStage`
- `Deal`, `DealWithContact`, `DealCardData`
- `Message`, `MessageThread`
- `ContactComment`
- `LeadFolder`
- Const enum arrays: `COMPANY_SIZES`, `CHANNELS`, `MESSAGE_DIRECTIONS`, `DEPARTMENT_OWNERS`, `LEAD_FOLDER_STATUSES`
- Label maps for each enum

**Reference**: Follow patterns in `src/types/task.ts`

---

### Step 3: CRM Zod Validations (`src/lib/validations/crm.ts`)
*Parallel with Step 1.*

Schemas:
- `createCompanySchema`, `updateCompanySchema`
- `createContactSchema`, `updateContactSchema`
- `createDealSchema`, `updateDealSchema`
- `createPipelineSchema`, `updatePipelineSchema`
- `createPipelineStageSchema`, `updatePipelineStageSchema`
- `createContactCommentSchema`
- `createLeadFolderSchema`, `updateLeadFolderSchema`
- `incomingMessageSchema` (for Unipile webhook)
- `sendMessageSchema` (for outbound)
- `reorderDealsSchema` (batch drag-drop)

**Reference**: Follow patterns in `src/lib/validations/task.ts`

---

### Step 4: CRM Server Actions (`src/lib/actions/crm.ts` + `inbox.ts`)
*Depends on Steps 1-3.*

Actions:
- `createCompany`, `updateCompany`, `deleteCompany` (soft)
- `createContact`, `updateContact`, `deleteContact` (soft)
- `getContacts` (with filters, pagination), `getContact` (with relations)
- `createDeal`, `updateDeal`, `deleteDeal` (soft), `reorderDeals`
- `moveDealToStage` (updates stage + publishes event context)
- `createPipeline`, `updatePipeline`, `getPipelines`
- `createPipelineStage`, `updatePipelineStage`, `reorderStages`
- `createComment`, `getComments`
- `importContacts` (CSV parse + bulk insert)

**Reference**: Follow patterns in `src/lib/actions/tasks.ts` — Zod validation → org membership check → Supabase query → `ActionState` return

---

### Step 5: Install shadcn Components
*Parallel — install before building pages.*

New shadcn components to add (not yet in `src/components/ui/`):
```bash
npx shadcn@latest add card form toast skeleton accordion progress toggle-group pagination alert-dialog collapsible context-menu resizable
```

---

### Step 6: Contact List Page
*Depends on Step 4.*

**Files:**
- `src/app/(dashboard)/crm/layout.tsx` — CRM layout wrapper
- `src/app/(dashboard)/crm/page.tsx` — Redirects to /crm/contacts
- `src/app/(dashboard)/crm/contacts/page.tsx` — Server: fetch contacts with company join, pass to client
- `src/app/(dashboard)/crm/contacts/client.tsx` — Client: searchable + filterable table, Realtime subscription

**Components:**
- `src/components/crm/contact-table.tsx` — TanStack Table with sortable columns: Name, Company, Stage, Deal Value, Owner, Last Contact, Score, Tags
- `src/components/crm/contact-filters.tsx` — Filter bar (department, tags, stage, owner, date range)

**Behavior:**
- Bulk actions: assign, move stage, export CSV
- Realtime subscription for live updates

**Design rules:** Table rows use `bg-card` with `border-default` separators. Hover: `bg-hover`. Active row: orange left border. No shadows. Touch targets 44px min.

---

### Step 7: Contact Detail Page
*Depends on Step 6.*

**Files:**
- `src/app/(dashboard)/crm/contacts/[id]/page.tsx` — Server: fetch contact + company + deals + messages + comments
- `src/app/(dashboard)/crm/contacts/[id]/client.tsx` — Client: editable fields, activity timeline, linked tasks/deals, communication tab

**Components:**
- `src/components/crm/contact-detail-header.tsx` — Name, company, stage badge, actions (send message, create task, move stage)
- `src/components/crm/activity-timeline.tsx` — Chronological: messages, tasks, deals, comments, stage changes. Filterable by type. Uses avatar + timestamp + description.
- `src/components/crm/comment-section.tsx` — @mention comments with 15-min edit window
- `src/components/crm/linked-tasks-panel.tsx` — Task cards linked to this contact (from task module)

---

### Step 8: Company CRUD
*Parallel with Step 7.*

**Files:**
- `src/app/(dashboard)/crm/companies/page.tsx` — Company list (table)
- `src/app/(dashboard)/crm/companies/[id]/page.tsx` — Company detail: contacts list, deal aggregate, activity summary
- `src/components/crm/company-form.tsx` — Create/edit company dialog

---

### Step 9: CSV Import
*Depends on Step 6.*

- `src/components/crm/csv-import-dialog.tsx` — Upload CSV, field mapping UI, duplicate detection (email/phone match), preview, bulk insert
- Server action: `importContacts` — parse CSV, validate each row, insert in batch, return summary

---

## Phase 2B — Pipeline & Deals

### Step 10: Pipeline Management
*Depends on Steps 1-4.*

**Files:**
- `src/app/(dashboard)/crm/pipelines/page.tsx` — List of pipelines, create new
- `src/app/(dashboard)/crm/pipelines/settings/page.tsx` — Pipeline stage configuration (name, colour, probability, department_owner, project_template_id), drag to reorder stages

**Components:**
- `src/components/crm/pipeline-settings.tsx` — Stage list with inline edit, DnD reorder, colour picker (palette-constrained)

---

### Step 11: Pipeline Kanban Board
*Depends on Step 10.*

**Files:**
- `src/app/(dashboard)/crm/pipelines/[pipelineId]/page.tsx` — Server: fetch pipeline + stages + deals with contacts
- `src/app/(dashboard)/crm/pipelines/[pipelineId]/client.tsx` — Client: Kanban + Realtime

**Components:**
- `src/components/crm/pipeline-kanban.tsx` — DnD Kit board. Columns = stages. Cards = deals (contact name, deal value, owner avatar, expected close date). Drag fires `moveDealToStage`. Optimistic update. WIP limits display. Filter bar (owner, probability range, date).
- `src/components/crm/deal-card.tsx` — Card: contact name, deal name, value with currency, owner avatar, expected close date, stage colour badge
- `src/components/crm/deal-drawer.tsx` — Sheet: full deal detail, edit fields, line items table, link to contact, stage history

**Pipeline stage colours** (from design system):
- Proposal = `#EE6C29`
- Negotiation = `#D45A1E`
- Lead = `#7AA6B3`
- Qualifier = `#9EC6D1`
- Closed/inactive = `#3D4141`

**Reference**: Reuse DnD Kit pattern from `src/components/tasks/kanban-board.tsx`

---

### Step 12: Deal CRUD
*Parallel with Step 11.*

- Create/edit deal dialog pre-filled with contact
- Line items editor (description, quantity, unit_price, total)
- Stage lifecycle: normal flow + won/lost with reason capture
- Won: triggers `Deal.Won` event
- Lost: captures `loss_reason`, triggers `Deal.Lost` event

---

## Phase 2C — Universal Inbox (Unipile)

### Step 13: Unipile Webhook Route
*Depends on Step 1 (messages table).*

**Files:**
- `src/app/api/webhooks/unipile/route.ts` — POST handler
  - HMAC-SHA256 signature validation (secret from env `UNIPILE_WEBHOOK_SECRET`)
  - Parse payload → validate with `incomingMessageSchema`
  - Contact matching: query `crm.contacts` by sender_identifier (email or phone)
  - If matched: insert message with `contact_id`
  - If unmatched: insert message with null `contact_id` (appears in Unassigned queue)
  - Update contact `last_contact_date`
  - Return 200

**Security:** HMAC-SHA256 validation of `x-unipile-signature` header. Rate limit with Upstash Redis.

---

### Step 14: Outbound Message Action
*Depends on Step 13.*

**Files:**
- `src/lib/actions/inbox.ts` — Server actions:
  - `sendMessage` — validate with `sendMessageSchema`, call Unipile API (`POST /chats/{chat_id}/messages` or `POST /chats` for new), log to `crm.messages` with direction='outbound', update contact `last_contact_date`
  - `matchContact` — manually match an unassigned message to a contact
  - `markMessageRead` — update read flag

---

### Step 15: Inbox UI
*Depends on Steps 13-14.*

**Files:**
- `src/app/(dashboard)/crm/inbox/page.tsx` — Server: fetch conversations grouped by contact
- `src/app/(dashboard)/crm/inbox/client.tsx` — Three-panel layout with Realtime

**Components:**
- `src/components/crm/inbox-layout.tsx` — Resizable 3-panel: channel list (left sidebar) → conversation list (center) → message thread (right). Use shadcn `resizable` panels.
- `src/components/crm/conversation-list.tsx` — Contact conversations with unread badge, channel icon, last message preview, timestamp. Sorted by most recent.
- `src/components/crm/message-thread.tsx` — Chat-style bubbles (inbound left, outbound right). Avatars, timestamps, inline attachments. Email: subject + body_html rendered safely (sanitized with DOMPurify).
- `src/components/crm/compose-panel.tsx` — Bottom compose: channel selector, text input, attachment upload (Supabase Storage), send button
- `src/components/crm/unassigned-queue.tsx` — Messages without contact match. Manual match button opens contact search dialog.
- `src/components/crm/create-task-from-message.tsx` — Select messages → open task drawer pre-populated with `contact_id` + message body as description

**Design:** Chat bubbles: inbound = `bg-card`, outbound = `accent-primary` bg. Channel icons use Moonstone tint. Unread dot = `#EE6C29`.

---

## Phase 2D — Cross-Module Integration

### Step 16: CRM Event Subscribers
*Depends on Step 1 events + Phase 1 event bus.*

**Database triggers** (defined in Step 1 migration):
- `Deal.StageChanged` → CRM: update contact timeline
- `Deal.Won` → placeholder for Phase 3 ERP (invoice creation)
- `Deal.Lost` → analytics, loss_reason logged
- `Message.Received` → CRM: update timeline, check auto-stage rules
- `Message.Sent` → CRM: update timeline + `last_contact_date`
- `LeadFolder.Submitted` → notification to receiving department lead

**Client-side subscriptions** (add to `src/lib/events/realtime.ts`):
- `subscribeToContacts(orgId, callback)`
- `subscribeToDeals(orgId, callback)`
- `subscribeToMessages(orgId, callback)`

---

### Step 17: Contact Activity Timeline Integration
*Depends on Steps 6, 11, 15.*

The `activity-timeline.tsx` component aggregates data from:
- `crm.messages` — inbound/outbound per channel
- `task.tasks` where `client_contact_id` matches — status changes
- `crm.deals` — stage changes
- `crm.contact_comments` — internal notes
- `shared.events` — filtered by contact_id in payload

Fetched server-side via multiple parallel queries, merged chronologically.

---

### Step 18: Lead Folder Handoff
*Depends on Steps 6, 16.*

**Files:**
- `src/app/(dashboard)/crm/lead-folders/page.tsx` — List of folders (pending, in_progress, completed)
- `src/components/crm/lead-folder-form.tsx` — Select contacts, add notes, select target department, submit
- `src/lib/actions/lead-folders.ts` — `createLeadFolder`, `updateLeadFolderStatus`, `acceptLeadFolder`

When submitted: `LeadFolder.Submitted` event → notification to receiving department lead.

---

## Phase 2E — Lead Scoring & Automations (CRM-level)

### Step 19: Lead Scoring Engine
*Depends on Steps 6, 15.*

**NOT a full automation engine** (that's Phase 4). Simple scoring:
- `src/lib/crm/scoring.ts` — function `calculateLeadScore(contact, messages, deals)` → integer score
- Factors: message frequency (last 30 days), response rate, deal value, stage progression, recency
- Called after message insert and deal stage change (via database function or server action)
- Score written to `contacts.lead_score`

---

### Step 20: Auto-Stage Rules (Simple)
*Depends on Step 19.*

Basic configurable rules stored as JSONB on `pipeline_stages` (`entry_conditions`/`exit_conditions`):
- First outbound message → auto-move to Outreach
- First inbound reply → auto-move to Engaged
- Evaluated in webhook handler and message send action

---

## Navigation Updates

### Step 21: Update Navigation
*Parallel — do early alongside Step 6.*

- `src/components/shared/sidebar.tsx` — CRM nav items already exist (Contacts, Pipelines, Inbox). Add sub-items: Companies (`/crm/companies`), Lead Folders (`/crm/lead-folders`)
- `src/components/shared/bottom-nav.tsx` — ensure CRM is in mobile bottom nav
- `src/components/shared/command-palette.tsx` — add CRM entities to global search (contacts, deals, companies)
- `src/app/api/search/route.ts` — add contact/deal search queries

---

## Verification Checklist

1. **Migration**: `npx supabase db push` succeeds. All 8 tables created with RLS policies. Default pipeline seeded.
2. **Contact CRUD**: Create contact → appears in list → edit fields → soft delete → filtered out. CSV import 10+ contacts.
3. **Company CRUD**: Create company → link contacts → company detail shows contact count + deal aggregate.
4. **Pipeline Kanban**: Drag deal between stages → `Deal.StageChanged` event in `shared.events` → contact timeline updated.
5. **Deal lifecycle**: Create deal → move through stages → mark Won → `Deal.Won` event published. Mark Lost → `loss_reason` captured.
6. **Inbox webhook**: POST to `/api/webhooks/unipile` with valid HMAC → message created → matched to existing contact by email/phone. Invalid HMAC → 401.
7. **Inbox UI**: Conversations display grouped by contact. Compose + send outbound → message logged with direction='outbound'. Unassigned queue shows unmatched messages.
8. **Create task from inbox**: Select message → open task drawer → contact_id and message body pre-filled → task created with contact link.
9. **Activity timeline**: Contact detail page shows messages, tasks, deals, comments in chronological order. Filterable by type.
10. **Lead folders**: Create folder with contacts → submit to department → notification received → accept → contacts' department_owner updated.
11. **Lead scoring**: Score calculated on message + deal events. Score visible in contact list + detail.
12. **Search**: Cmd+K finds contacts + deals by name. `/api/search` returns CRM entities.
13. **Responsive**: Contact list, pipeline, inbox all work on mobile (bottom nav). Inbox collapses to single-panel on mobile.
14. **RBAC**: Guest can only view assigned contacts. Member can create/edit own. Manager sees team. Owner/Admin sees all.

---

## Key Decisions

- **Migration `0006`** — matches PRD numbering; 0005 is reserved for future auth changes
- **No TanStack Query** — keep existing pattern (server-side fetch + Realtime refresh) for consistency
- **No full automation engine** — Phase 2E is simple scoring + basic auto-stage only (full builder is Phase 4)
- **Email body sanitization** — DOMPurify, never raw `dangerouslySetInnerHTML` on unsanitized content
- **Unipile env vars** — `UNIPILE_API_KEY` + `UNIPILE_WEBHOOK_SECRET` required for inbox to function
- **Pipeline stage colours** — constrained to palette values from `colour-palette.md`
- **Scope excludes**: reporting dashboards (Phase 4), Google Calendar sync (Phase 4), Stripe integration (Phase 3)

---

## New Files to Create

### Database
- `supabase/migrations/0006_crm_schema.sql`

### Types & Validations
- `src/types/crm.ts`
- `src/lib/validations/crm.ts`

### Server Actions
- `src/lib/actions/crm.ts`
- `src/lib/actions/inbox.ts`
- `src/lib/actions/lead-folders.ts`
- `src/lib/crm/scoring.ts`

### Pages
- `src/app/(dashboard)/crm/layout.tsx`
- `src/app/(dashboard)/crm/page.tsx`
- `src/app/(dashboard)/crm/contacts/page.tsx`
- `src/app/(dashboard)/crm/contacts/client.tsx`
- `src/app/(dashboard)/crm/contacts/[id]/page.tsx`
- `src/app/(dashboard)/crm/contacts/[id]/client.tsx`
- `src/app/(dashboard)/crm/companies/page.tsx`
- `src/app/(dashboard)/crm/companies/[id]/page.tsx`
- `src/app/(dashboard)/crm/pipelines/page.tsx`
- `src/app/(dashboard)/crm/pipelines/settings/page.tsx`
- `src/app/(dashboard)/crm/pipelines/[pipelineId]/page.tsx`
- `src/app/(dashboard)/crm/pipelines/[pipelineId]/client.tsx`
- `src/app/(dashboard)/crm/inbox/page.tsx`
- `src/app/(dashboard)/crm/inbox/client.tsx`
- `src/app/(dashboard)/crm/lead-folders/page.tsx`
- `src/app/api/webhooks/unipile/route.ts`

### Components
- `src/components/crm/contact-table.tsx`
- `src/components/crm/contact-filters.tsx`
- `src/components/crm/contact-detail-header.tsx`
- `src/components/crm/activity-timeline.tsx`
- `src/components/crm/comment-section.tsx`
- `src/components/crm/linked-tasks-panel.tsx`
- `src/components/crm/company-form.tsx`
- `src/components/crm/csv-import-dialog.tsx`
- `src/components/crm/pipeline-kanban.tsx`
- `src/components/crm/pipeline-settings.tsx`
- `src/components/crm/deal-card.tsx`
- `src/components/crm/deal-drawer.tsx`
- `src/components/crm/inbox-layout.tsx`
- `src/components/crm/conversation-list.tsx`
- `src/components/crm/message-thread.tsx`
- `src/components/crm/compose-panel.tsx`
- `src/components/crm/unassigned-queue.tsx`
- `src/components/crm/create-task-from-message.tsx`
- `src/components/crm/lead-folder-form.tsx`

### Existing Files to Modify
- `src/components/shared/sidebar.tsx` — add CRM sub-nav items (Companies, Lead Folders)
- `src/components/shared/bottom-nav.tsx` — ensure CRM is in mobile nav
- `src/components/shared/command-palette.tsx` — add CRM search
- `src/app/api/search/route.ts` — add contact/deal queries
- `src/lib/events/realtime.ts` — add CRM-specific subscriptions

---

## Build Order (Dependency Graph)

```
Step 1 (Migration) ──┬── Step 2 (Types) ──────┐
                     ├── Step 3 (Validations) ──┤
                     └── Step 5 (shadcn add) ───┤
                                                ▼
                            Step 4 (Server Actions)
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            Step 6 (Contacts)  Step 10 (Pipelines) Step 13 (Webhook)
                    │               │               │
                    ▼               ▼               ▼
            Step 7 (Detail)    Step 11 (Kanban)  Step 14 (Send)
            Step 8 (Companies) Step 12 (Deals)   Step 15 (Inbox UI)
            Step 9 (CSV)                             │
                    └───────────┬───────────────────┘
                                ▼
                    Steps 16-21 (Integration + Scoring + Nav)
```
