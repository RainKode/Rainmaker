# Rainmaker App

> **Repo:** https://github.com/RainKode/rainmaker-app
> **Vercel project:** `faiyazs-projects-fd385e37/rainmaker-app` (auto-deploys from `master`)
> **Branch:** `master`
> **Last updated:** 2026-03-21

---

## Project Status

| Area | Status | Notes |
|------|--------|-------|
| Next.js 16 project | Done | App Router, Turbopack, TypeScript, Tailwind v4 |
| Dependencies | Done | 60 packages installed |
| shadcn/ui | Done | Initialized, `components.json` configured |
| Git repo | Done | https://github.com/RainKode/rainmaker-app |
| Vercel project | Done | Linked to GitHub, auto-deploy on push to master |
| Vercel env vars | Scaffolded | 10 vars added — replace placeholders with real keys |
| Supabase schema | Done | Migration file ready — needs running in SQL Editor |
| Supabase client | Done | Server + client helpers + auth middleware |
| CI (GitHub Actions) | Done | Lint, type-check, build on every push |
| MCP servers | Done | shadcn, Supabase, Vercel in .vscode/mcp.json |
| Supabase project | Pending | Create project and fill in real keys |
| Stripe keys | Pending | Add real test/live keys to Vercel |
| Upstash Redis | Pending | Add real keys to Vercel |
| Resend | Pending | Add real API key to Vercel |
| App pages / features | Not started | |

---

## Immediate Next Steps

### 1. Supabase
- Create a project at https://supabase.com
- Settings > API > copy Project URL, anon key, service_role key
- SQL Editor > paste and run `supabase/migrations/0001_initial_schema.sql`
- Update these Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Update `supabase/config.json` with your real project ID

### 2. Stripe
- https://stripe.com > Developers > API Keys
- Update `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Create webhook pointing to `https://your-deploy-url.vercel.app/api/webhooks/stripe`
- Update `STRIPE_WEBHOOK_SECRET`

### 3. Upstash Redis
- https://upstash.com > create Redis database
- Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 4. Resend
- https://resend.com > create API key
- Update `RESEND_API_KEY`

### 5. Update Vercel env vars with real values
```bash
vercel env rm VARIABLE_NAME production
echo "real_value" | vercel env add VARIABLE_NAME production
```

### 6. Update NEXT_PUBLIC_APP_URL
Set to your actual Vercel deploy URL once the first deployment completes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth & DB | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe |
| Email | Resend |
| Rate Limiting | Upstash Redis |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Deployment | Vercel |

---

## Local Development

```bash
git clone https://github.com/RainKode/rainmaker-app.git
cd rainmaker-app
pnpm install
cp .env.example .env.local
# fill in .env.local with real keys
pnpm dev
```

Open http://localhost:3000

---

## Deployment

Vercel is already linked to this repo. Every push to `master` triggers a production deploy automatically.

To manually deploy:
```bash
vercel --prod
```

---

## MCP Servers (VS Code Copilot Agent)

Configured in `.vscode/mcp.json` — prompts for tokens on first use via VS Code input:

- **shadcn** — Generate and manage UI components
- **Supabase** — Query and manage your database
- **Vercel** — Manage deployments and environment variables

---

## Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
  components/ui/    # shadcn/ui components
  lib/
    supabase/       # server.ts (Server Components) + client.ts (browser)
    utils.ts        # cn() utility
  middleware.ts     # Auth middleware — protects /dashboard routes

supabase/
  config.json                       # Project ID (update after creating Supabase project)
  migrations/
    0001_initial_schema.sql         # profiles, subscriptions, RLS policies, triggers

.github/workflows/
  ci.yml            # Lint + type-check + build CI on every push

.vscode/
  mcp.json          # MCP server config for Copilot agent mode

vercel.json         # Vercel build settings (pnpm, nextjs, regions)
.env.example        # Template with all required env var keys (no real values)
```
