# AGENTS.md

## Repo Purpose

Software Eventos is a production web application for an events and catering
business. It will manage events, venues, sellers, payments, balances, debtors,
audit logs and financial reports.

## Stack

- Next.js App Router with TypeScript.
- Tailwind CSS for styling.
- Supabase for Auth, PostgreSQL, Row Level Security and local development.
- Supabase migrations for every database change.
- Vercel for frontend deployment.
- pnpm for package management.

## Folder Conventions

- App routes live in `src/app`.
- Shared UI components live in `src/components`.
- Supabase browser, server and middleware helpers live in `src/lib/supabase`.
- Generated and shared TypeScript types live in `src/types`.
- Supabase migrations live in `supabase/migrations`.
- General utilities live in `src/utils`.

## Commands Before Finishing

Run these when relevant before handing work back:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If a database schema changes, also run:

```bash
pnpm supabase:types
```

## Security Rules

- Never hardcode Supabase credentials or other secrets.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components or browser code.
- Only variables prefixed with `NEXT_PUBLIC_` may be used by client-side code.
- Prefer server-side access for privileged operations.
- Do not log secrets, tokens or sensitive customer/payment data.

## Supabase Rules

- Use migrations for all schema changes.
- Do not edit applied migrations in shared environments; add a new migration.
- Authorization belongs in Supabase Row Level Security policies.
- Sellers must only access venues assigned to them and related events/payments.
- Admin-only data and audit logs must require explicit admin authorization.
- Regenerate TypeScript database types after schema changes.

## Definition Of Done

- The requested feature or fix is implemented with minimal unrelated changes.
- Lint, typecheck and build pass, or failures are reported with the next fix.
- Database changes are covered by migrations and generated types when applicable.
- No secrets are committed or exposed to client code.
- README or AGENTS instructions are updated when workflows change.
