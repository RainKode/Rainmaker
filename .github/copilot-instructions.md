# Project Guidelines — Rainmaker

Unified Task Management + CRM + ERP platform for SMEs.
- Full requirements: [PRD/rainmaker_prd.md](../PRD/rainmaker_prd.md)
- **Build order**: [Phase.md](../Phase.md) — 5-phase plan. Currently on **Phase 0 (Auth/RBAC/App Shell)**.

## Current Scaffold State

| Item | Status |
|------|--------|
| Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui | ✅ Done |
| Supabase client/server helpers + middleware | ✅ Done |
| DB migration 0001 (profiles + subscriptions) | ✅ Done |
| Route groups, pages, modules | ❌ Not started |
| Test runner (Vitest/Playwright) | ❌ Not configured |

**Next step**: Phase 0 — run migration `0002_auth_rbac.sql`, build auth pages + app shell.

## Tech Stack (Actual Versions)

- **Framework**: Next.js **16** (App Router, Turbopack, Server Actions, Route Handlers)
- **Language**: TypeScript **5** (strict mode)
- **UI**: shadcn/ui + Radix UI + **Tailwind CSS v4**
- **State**: **Zustand v5** (client) + **TanStack Query v5** (server)
- **Forms**: React Hook Form + **Zod v4**
- **Database**: Supabase (PostgreSQL 15+) with Row Level Security
- **Auth**: Supabase Auth — `@supabase/ssr` for server/middleware, email/password, OAuth, 2FA
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Storage**: Supabase Storage (S3-compatible)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Cache**: Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
- **Email**: Resend
- **Payments**: Stripe
- **Charts**: Recharts
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

# Dev server (Turbopack)
pnpm dev

# Production build
pnpm build

# Type check (no emit)
npx tsc --noEmit

# Lint
pnpm lint

# Database migrations
npx supabase db push        # push local migrations to remote
npx supabase db diff        # generate migration from schema changes
```

> **Note**: Vitest and Playwright are **not yet installed**. Add them before writing tests:
> `pnpm add -D vitest @vitejs/plugin-react playwright`

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
- **Design system rules**: `.github/instructions/Design-MD.instructions.md` is auto-applied to all `*.tsx`, `*.jsx`, `*.css`, and files under `components/` or `app/`. Read it before building any UI.
- **Colour palette**: every colour used must exist in `.github/instructions/colour-palette.md`. No new hex values — ever.
- **Font**: Satoshi (`@fontsource/satoshi`). Never substitute another typeface.
- **No shadows**: elevation uses luminosity steps in dark mode; `0.5px border-card` in light mode.
- **Rounded full on buttons**, `rounded-xl` on cards/inputs.
- **UI Skill**: `.github/skills/ui/SKILL.md` contains priority-ordered design rules — load it when building any UI.

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
- **Phased delivery** — see [Phase.md](../Phase.md) for the 5-phase plan. Phase 0 = Auth/RBAC/Shell (current).
- **`@supabase/ssr`** is the canonical Supabase auth helper — do not use `@supabase/auth-helpers-nextjs` for new code.
- **Server Actions** for all mutations; Route Handlers only for webhooks and external API calls.
- **Middleware** (`src/middleware.ts`) already refreshes sessions and protects `/dashboard`. Extend it as route groups are added.
- **Zod v4 API**: use `z.string().min()` etc. — Zod v4 changed `z.object().merge()` and error APIs; check docs if unsure.
- **Zustand v5**: `create` API is unchanged but `immer` middleware import path changed — use `zustand/middleware/immer`.
- **TanStack Query v5**: `useQuery` requires `{ queryKey, queryFn }` object syntax (no positional args).
