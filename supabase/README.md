# Database

Postgres schema for ReviewDot V2, written for Supabase but portable to any
Postgres 14+ instance.

```
migrations/0001_schema.sql   tables, indexes, triggers
migrations/0002_rls.sql      row level security — where tenant isolation lives
migrations/0003_plans.sql    plan catalogue and limits
migrations/0004_auth.sql     auth.users → profiles, and onboarding
tests/rls_test.sql           isolation tests; every check raises on failure
tests/auth_test.sql          signup trigger and onboarding
```

## Applying

With the Supabase CLI, against a linked project:

```bash
supabase db push
```

Or directly with psql, in order:

```bash
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

## Testing isolation

The tests run inside a transaction and roll back, so they are safe against a
development database. They need the Supabase roles (`anon`, `authenticated`,
`service_role`) and an `auth.uid()` function to exist — both are present in a
real Supabase project.

```bash
npm run db:test    # runs every file in tests/, in order
```

23 isolation checks and 29 auth checks. Both suites run inside a transaction and
roll back.

A clean run prints one `ok` line per check. Any failure aborts with `FAILED: …`.

Covered: cross-organization reads and writes, outlet-scoped roles, anonymous
scan submissions against live vs paused campaigns, forged AI drafts, and
platform-admin visibility.

## Design notes

- **Every tenant-owned row carries `organization_id`**, and outlet-scoped rows
  also carry `outlet_id`, so policies never need a join to authorize.
- **The browser never supplies `organization_id` for authorization.** Policies
  derive it from `auth.uid()` via `app_member_orgs()`.
- **`ai_review_drafts`, `review_events` and `usage_counters` have no client
  insert policy.** They are written by server code holding the service role, so
  a browser cannot forge a draft, a review click, or metered usage.
- **`qr_campaigns.public_id`** is the unguessable `/r/{id}` segment;
  `reference_code` (`RD-LL-TH-T04`) is a printed label only and is never used
  for lookups.
- Anonymous submissions are gated by `app_campaign_is_live()`, which checks the
  campaign, its outlet and the organization are all active — pausing a QR code
  stops collection without reprinting anything.

## Auth wiring (0004)

Before this migration a signup produced an `auth.users` row, no `profiles` row,
and therefore no membership — so every policy in 0002 denied the new user
everything. Three things close that:

- **`profiles.id` → `auth.users(id)`**, `on delete cascade`. Deleting the auth
  user now removes their profile, and through it their memberships.
- **`on_auth_user_created` / `on_auth_user_updated`** fill and maintain the
  profile mirror. They read only the metadata Supabase itself sets, and handle
  both `full_name` (email signup) and `name`/`avatar_url` (Google).
- **`app_create_organization()`** creates the organization, the caller's `OWNER`
  membership, the first outlet and a free subscription in one transaction.

That last one is a `security definer` function rather than an insert policy on
`organizations` because any policy permissive enough to create the *first*
organization would also let an authenticated user create unlimited ones with
arbitrary short codes. The function makes those checks explicitly: caller must
be authenticated, must not already own an organization, and slug and short code
are derived and de-duplicated server-side rather than taken from the browser.

Applying 0004 to a database whose `profiles` contain ids with no matching
`auth.users` row will fail on the foreign key. Reconcile those rows rather than
dropping the constraint — an unattached profile is one nobody can ever sign in
as.
