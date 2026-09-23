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
migrations/0007_campaign_reporting.sql per-campaign scan and feedback counts
migrations/0008_role_alignment.sql  write policies matched to the role matrix
migrations/0009_analytics.sql       tags, funnel and customer aggregates
migrations/0010_products.sql        per-product feedback counts
migrations/0011_limits.sql          durable rate limiting, usage metering
migrations/0012_team.sql            colleague profiles, invitations, grants
migrate.sh                   the runner: applies each migration once, tracked
tests/rls_test.sql           isolation tests; every check raises on failure
tests/auth_test.sql          signup trigger and onboarding
tests/policy_test.sql        roles, response scope, triage scope, erasure
tests/flow_test.sql          the customer journey, end to end
tests/reporting_test.sql     dashboard aggregates, and their isolation
tests/limits_test.sql        rate limiting and usage metering
tests/team_test.sql          colleague visibility, invitations, seat limits
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

220 checks in total — 23 isolation, 29 auth, 47 policy, 23 flow, 50 reporting,
24 limits, 24 team.
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

## Role alignment (0008)

`src/lib/permissions.ts` grants REGIONAL_MANAGER `outlet:update`,
`product:manage` and `campaign:create/update/archive`, and describes the role as
"manages the outlets assigned to them". The policies granted none of those:
outlets and products were org-admin only, and campaigns allowed OUTLET_MANAGER
but not REGIONAL_MANAGER.

That disagreement is the failure the matrix exists to prevent — the UI offers a
button and the database refuses it, with nothing to tell the user why. Writing
the tests for the QR campaign form is what surfaced it.

The policies were widened to match the documented intent rather than the matrix
narrowed, because a regional manager who cannot create a QR code for their own
outlets is not the role the product describes. The scoping is unchanged in
substance: every new grant still goes through `app_can_see_outlet`, so a
regional manager reaches their assigned outlets and no others. Creating and
archiving an outlet stays with the organization's admins, which is what the
matrix says.

## Limits (0011)

Two things that were held in a Node process and therefore were not really held.

**Rate limits** lived in a `Map`: on more than one instance the real ceiling was
(instances × limit), and a cold start wiped it. `app_rate_limit()` counts in
Postgres with an `insert … on conflict do update`, so two requests racing on the
same key cannot lose a count the way a read-modify-write would. The table is
revoked from every client role — including `anon` and `authenticated` by name,
because Supabase's default privileges grant those explicitly and a revoke from
`PUBLIC` does not take them away. A test asserts a signed-in user can neither
read the table nor call the function.

**Usage** was never recorded at all. `usage_counters` had existed since 0001 and
never held a row, so every plan limit was data nobody read. `app_record_usage()`
increments atomically for the current month.

`app_quota_usage()` reports live totals — outlets, campaigns, members, products
— by counting rather than metering, because a stored counter drifts the first
time something is deleted and then either blocks a customer who is under their
limit or lets one sail past it. Archiving an outlet frees the allowance
immediately, and there is a test for exactly that.

## Team (0012)

Two things that made the team feature look finished while it was not.

**Colleagues were invisible to each other.** `profiles` had one SELECT policy,
`profiles_self` — your own row and nothing else. The team list joins members to
profiles for a name and an email, so every organization saw one member (the
person looking) and a list of blanks. RLS ORs its SELECT policies, so the fix is
an additional policy rather than a wider one: `profiles_colleagues` allows a row
whose owner shares an organization with the caller. `app_shares_organization()`
is `security definer` so it can read `organization_members` without recursing
through the policy being evaluated, and its `search_path` is pinned.

**There was no way to add anyone.** `organizations` has no insert policy on
purpose and `organization_members` has no self-insert, so a second person could
sign up and then belong to nothing. `organization_invites` plus three functions
close that:

- `app_create_invite()` is `security definer` and checks everything explicitly —
  the caller is an OWNER or ADMIN of the organization they name, the address
  parses, that person is not already a member, and the seat allowance covers one
  more. Outstanding invitations count against the allowance, or a workspace on
  two seats could issue twenty links and let them all through.
- `app_accept_invite()` matches the token against the caller's **own**
  `profiles.email`, not against an address in the request. That is what makes
  the link safe to hand over in a chat message: forwarding it to someone else
  gets them a page and no membership.
- `app_invite_preview()` is granted to `anon`, because the person being invited
  usually has no account yet and needs to see which workspace this is before
  signing up. It returns the workspace name, the invited address and the role —
  nothing that is not already in the message they were sent.

Re-inviting the same address replaces the previous token rather than issuing a
second one (`on conflict (organization_id, email)`), so a link that was sent to
the wrong place stops working as soon as a new one is made. A test pins that.

**Service-role grants.** 0011 revoked `app_rate_limit`, `app_prune_rate_limits`
and `app_record_usage` from `PUBLIC`. On Supabase that leaves `service_role`
working, because its default privileges grant execute explicitly; on a plain
Postgres it leaves the durable rate limiter and the usage meter failing into
their fallbacks, silently. 0012 grants those three to `service_role` by name.
