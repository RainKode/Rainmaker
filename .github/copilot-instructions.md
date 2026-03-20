# Project Guidelines — Rainmaker

Unified Task Management + CRM + ERP platform for SMEs. See [PRD/rainmaker_prd.md](../PRD/rainmaker_prd.md) for full requirements.

## Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: Zustand (client) + TanStack Query (server)
- **Database**: Supabase (PostgreSQL 15+) with Row Level Security
- **Auth**: Supabase Auth (GoTrue) — email/password, OAuth, 2FA
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Storage**: Supabase Storage (S3-compatible)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Cache**: Upstash Redis (serverless)
- **Email**: Resend
- **Charts**: Recharts or Tremor
- **Deploy**: Vercel + Supabase

## Architecture

Modular monolith — single Next.js app with module-specific route groups sharing a common Supabase data layer.

### Modules

| Module | Schema | Route Group | Purpose |
|--------|--------|-------------|---------|
| Auth & RBAC (Mod 0) | `public` | `(auth)` | Users, orgs, workspaces, roles |
| Task Management (Mod 1) | `task` | `(tasks)` | Projects, tasks, time tracking |
| CRM / Ringmaker (Mod 2) | `crm` | `(crm)` | Contacts, pipelines, Universal Inbox |
| ERP / Rainmaker (Mod 3) | `erp` | `(erp)` | Ledger, invoices, assets, expenses |
| Shared Services | `shared` | — | Events, notifications, automations, audit |

### Event Bus

Cross-module communication via `shared.events` table + database triggers + Supabase Realtime + Edge Functions. Every domain mutation publishes an event. Subscribers process side effects (auto-journal entries, CRM timeline updates, notifications). Events are idempotent — `source_event_id` UNIQUE constraint prevents duplicate processing.

### Multi-tenancy

RLS on every table scoped by `organisation_id`. Never query without org context. Every new table must have an `organisation_id` column and corresponding RLS policy.

## Build and Test

```bash
# Install
pnpm install

# Dev
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Test (unit + integration)
pnpm test          # Vitest

# E2E
pnpm test:e2e      # Playwright

# Database migrations
npx supabase db push
npx supabase db diff
```

## Conventions

### File & Folder Structure

```
src/
  app/
    (auth)/          # Auth pages & layouts
    (tasks)/         # Task module routes
    (crm)/           # CRM module routes
    (erp)/           # ERP module routes
    api/             # Route handlers + webhooks
  components/
    ui/              # shadcn/ui components
    shared/          # Cross-module components
    tasks/           # Task-specific components
    crm/             # CRM-specific components
    erp/             # ERP-specific components
  lib/
    supabase/        # Client, server, middleware helpers
    events/          # Event Bus publishers + subscribers
    hooks/           # Shared React hooks
    utils/           # Utility functions
  types/             # Shared TypeScript types & Zod schemas
```

### Database

- Schema-per-module (`task.`, `crm.`, `erp.`, `shared.`).
- Use Supabase client library (parameterised queries) — never raw SQL in app code.
- Every table: `id` (UUID PK), `organisation_id` (FK + RLS), `created_at`, `updated_at`.
- Soft deletes (`is_active = false`) unless specified otherwise.
- Journal entries must always balance: total debits = total credits (CHECK constraint).

### API & Data

- Server Actions for mutations; Route Handlers for webhooks and external API.
- Validate all inputs with Zod at the API boundary.
- Use `usePermissions()` hook for conditional UI rendering based on RBAC role.
- RBAC middleware on every API route — check role before mutations.
- Pagination: cursor-based for large datasets.

### UI

- shadcn/ui as the component library — don't reinvent primitives.
- Tailwind CSS for styling — no CSS modules or styled-components.
- Responsive: desktop (full sidebar), tablet (collapsible sidebar), mobile (bottom nav).
- WCAG 2.1 AA: keyboard navigation, screen reader support, contrast ratios.
- Optimistic UI updates for drag-and-drop (Kanban boards, pipeline views).

### Events

When adding a new domain action that affects other modules, always:
1. Publish an event to `shared.events` with a typed `event_type` and JSONB payload.
2. Register subscribers in relevant modules.
3. Guard against duplicate processing with `source_event_id`.

### Security

- Never expose secrets in client code — use server-side env vars only.
- RLS policies on every table. Test with pgTAP.
- Rate limit API routes with Upstash Redis.
- HMAC-sign outbound webhooks.
- Sanitise all user content rendered as HTML (email bodies from Universal Inbox).

## Key Decisions

- **Unipile** powers the Universal Inbox (WhatsApp, Email, LinkedIn, etc.) — all messaging goes through their API.
- **No self-hosted infra** — Vercel + Supabase only.
- **Solo developer** — keep abstractions minimal; avoid premature optimisation.
- **Phased delivery** — see PRD §10 for the 5-phase, 30-week plan. Phase 1 = Task Management foundation.
