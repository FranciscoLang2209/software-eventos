# Software Eventos

Production-ready web application foundation for managing events, venues,
catering operations, sellers, payments, balances, debtors, audit logs and
financial reports.

The app has two intended roles:

- `admin`: manages users, venues, events, payments, audit logs and reports.
- `seller`: accesses only assigned venues and related events/payments.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL and Row Level Security
- Supabase migrations
- Vercel deployment
- pnpm

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the Supabase project values.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key for browser and server clients using RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for future trusted backend operations.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components, browser bundles or
public logs.

## Start Next.js

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Start Supabase Locally

The local Supabase stack requires Docker.

```bash
pnpm supabase:start
```

Stop it with:

```bash
pnpm supabase:stop
```

## Reset Local Database

```bash
pnpm supabase:reset
```

This reapplies migrations and runs `supabase/seed.sql`.

## Add Migrations

Create SQL migration files in `supabase/migrations/` with ordered names, for
example:

```bash
supabase migration new create_events_tables
```

Do not edit migrations that have already been applied to shared environments.
Add a new migration instead.

## Generate Supabase Types

After starting Supabase locally and applying migrations:

```bash
pnpm supabase:types
```

The generated types are written to `src/types/database.types.ts`.

## Connect To Vercel

1. Push this repository to GitHub.
2. Import the GitHub repository in Vercel.
3. Set the framework preset to Next.js.
4. Add the required Supabase environment variables in Vercel Project Settings.
5. Deploy from the main production branch.

## Deployment Notes

- Keep database changes versioned in Supabase migrations.
- Use Supabase RLS for authorization rules.
- Do not hardcode credentials or service role keys.
- Run `pnpm lint`, `pnpm typecheck` and `pnpm build` before merging.
- Generate fresh Supabase types after schema changes.

## Current Status

This repository contains only the initial application shell, Supabase helpers,
route placeholders and migration scaffolding. The production schema and business
logic still need validation before implementation.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
