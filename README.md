# Rainmaker App

A modern SaaS starter built with Next.js 16, Supabase, Stripe, and shadcn/ui.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth & DB | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe |
| Email | Resend |
| Rate Limiting | Upstash Redis |
| State | Zustand + TanStack Query |
| Deployment | Vercel |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/rainmaker-app.git
cd rainmaker-app
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`.

### 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key** from Project Settings ? API
3. Copy your **service_role key** (server-side only)
4. Run the SQL in `supabase/migrations/0001_initial_schema.sql` via the Supabase SQL Editor

### 4. Stripe Setup

1. Grab test keys from [stripe.com](https://stripe.com) Dashboard ? Developers ? API Keys
2. Set up a webhook to `https://yourdomain.com/api/webhooks/stripe`
3. Copy the webhook signing secret

### 5. Upstash Redis

Create a Redis database at [upstash.com](https://upstash.com) and copy the REST URL + token.

### 6. Resend

Create an API key at [resend.com](https://resend.com).

### 7. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example`
4. Deploy — Vercel auto-deploys on every push to `main`

## MCP Servers (VS Code Copilot)

Configured in `.vscode/mcp.json`:

- **shadcn** — Generate and manage UI components
- **Supabase** — Query and manage your database  
- **Vercel** — Manage deployments and environment variables

## Project Structure

```
src/
+-- app/              # Next.js App Router pages & layouts
+-- components/ui/    # shadcn/ui components
+-- lib/
¦   +-- supabase/     # Supabase server + client helpers
¦   +-- utils.ts      # cn() utility
+-- middleware.ts     # Auth middleware (protects /dashboard)
supabase/
+-- config.json
+-- migrations/       # SQL migration files
```
