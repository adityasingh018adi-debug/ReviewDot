# Database

Postgres schema for ReviewDot V2, written for Supabase but portable to any
Postgres 14+ instance.

```
migrations/0001_schema.sql   tables, indexes, triggers
migrations/0002_rls.sql      row level security — where tenant isolation lives
migrations/0003_plans.sql    plan catalogue and limits
migrations/0004_auth.sql     auth.users → profiles, and onboarding
migrations/0005_hardening.sql indexes, policy scope, erasure
migrations/0006_reporting.sql dashboard aggregation, in the database
migrate.sh                   the runner: applies each migration once, tracked
tests/rls_test.sql           isolation tests; every check raises on failure
tests/auth_test.sql          signup trigger and onboarding
tests/policy_test.sql        roles, response scope, triage scope, erasure
tests/flow_test.sql          the customer journey, end to end
tests/reporting_test.sql     dashboard aggregates, and their isolation
```

## Applying

With the Supabase CLI, against a linked project:

```bash
supabase db push
```

Or with the runner, which applies each file once and records it:

```bash
npm run db:migrate              # apply anything outstanding
npm run db:migrate -- --status  # show what has run and what has not
```

Every migration runs inside its own transaction, so a failure leaves nothing
behind. Applying twice is a no-op. Editing a migration that has already run is
reported as an error rather than silently ignored — write a new one instead.

**On a database that already has the schema** (applied by hand before the runner
existed), record the current state once so the runner does not try to re-run it:

```bash
npm run db:migrate -- --baseline
```

## Testing isolation

The tests run inside a transaction and roll back, so they are safe against a
development database. They need the Supabase roles (`anon`, `authenticated`,
`service_role`) and an `auth.uid()` function to exist — both are present in a
real Supabase project.

```bash
npm run db:test    # runs every file in tests/, in order
```

138 checks in total — 23 isolation, 29 auth, 39 policy, 23 flow, 24 reporting.
Every suite runs inside a transaction and rolls back, so they are safe against a
development database.

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

## Hardening (0005)

**Indexes.** `app_can_see_outlet()` filters `team_assignments where outlet_id = ?`
and is evaluated per row on every feedback, campaign, scan and session read. The
only index containing `outlet_id` was `unique(member_id, outlet_id)`, whose
leading column is wrong for that lookup, so the hottest path in the whole
security model was a sequential scan. That is fixed, along with every other
foreign key that had no usable index — including the cascade paths from
`outlets`, which otherwise scan each child table while holding a lock on it.

On `qr_scans` and `analytics_events` the cascade index is a deliberate trade:
one more index to maintain on the two highest-volume insert paths, so that
deleting an outlet does not lock them for minutes. Worth revisiting when those
tables are partitioned.

**Response scope.** `review_responses` was the one outlet-scoped table without an
`outlet_id`, so its policy fell back to plain organization membership — letting a
STAFF member edit and delete replies for outlets they cannot even see. It now
carries `outlet_id` like everything else, and the policies split into insert
(as yourself, in a visible outlet), update and delete (your own reply, or any
reply if you are an org admin).

**Triage scope.** The `feedback_update` policy was commented "status, assignment
and notes", but row level security cannot restrict columns, so it permitted
rewriting the customer's own comment and rating. Column privileges express this
properly: `authenticated` may now update only `status` and `assigned_to`.
`service_role` is untouched, so server-side jobs still write `sentiment`.

**Erasure.** `app_erase_feedback_contact()` nulls the contact fields and stamps
`contact_erased_at`, leaving the rating and comment intact — honouring a request
should not silently rewrite the business's history. Outright deletion is
available to org admins for the cases erasure does not cover; the cascades take
the drafts, mentions and replies with it.

## Reporting (0006)

The dashboard used to fetch every row and bucket, average and trend it in
JavaScript. That is free against a seeded array and impossible against two
million feedback rows, so the aggregation moved into the database before the
first real query was written rather than after.

`app_overview`, `app_daily_series`, `app_outlet_breakdown` and
`app_rating_distribution` each answer one panel in one round trip.

All four are **SECURITY INVOKER**, which is the default and is load-bearing.
They read tenant tables, so they must run as the caller with row level security
applying. A SECURITY DEFINER function here would turn every one of them into a
way to read another tenant's numbers.

They take `p_org` from the caller, and that argument is *not* what authorizes the
read — the policies on the underlying tables are. Asking for another
organization's id returns zeroes rather than their data, and an outlet-scoped
member sees only their assigned outlets. `reporting_test.sql` checks both.

`app_daily_series` uses `generate_series` rather than a group-by, so a quiet day
is a zero on the chart instead of a gap the line is drawn straight through.
