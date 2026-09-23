# ReviewDot — working notes for Claude

AI customer review and feedback platform.
Next.js 15 (App Router) · React 18 · TypeScript · Tailwind v4 · Supabase · Vitest · Playwright.

## Architecture

- `app/` route handlers and pages; `src/views/` holds the page bodies (client
  components), `src/components/` the shared UI. **Never create `src/pages/`** —
  Next treats it as the legacy Pages Router and the build fails.
- Server-only code is separated by filename, not by discipline:
  `ai-review.server.ts` and `serviceClient()` throw if they ever run in a
  browser. A client component importing them pulls the Anthropic SDK into the
  bundle, which is how the key would leak. An e2e test greps every client
  bundle for `anthropic` and `sk-ant` to keep that honest.
- AI runs behind `/api/ai/*`. The browser never holds a model key.
- Tenant isolation lives in Postgres (`supabase/migrations/0002_rls.sql`), not
  in queries. `src/lib/permissions.ts` mirrors it for the UI only.

## Auth and modes

- `src/lib/app-mode.ts` decides how a deployment runs: **live** (Supabase
  configured, auth enforced), **demo** (`NEXT_PUBLIC_DEMO_MODE=1`, seeded data,
  no accounts), **unconfigured** (refuses to render the dashboard). A *missing*
  variable can only move towards refusing — never towards an open dashboard —
  and `live` always beats a stray demo flag. Don't add a fallback that reverses
  this.
- `NEXT_PUBLIC_*` is inlined at build time, so demo mode must be set for the
  **build**, not just `next start`. Playwright's `webServer` does both.
- Two server clients, and the difference is the whole point:
  `serverClient()` carries the user's JWT so RLS applies — use it for anything a
  signed-in user does; `serviceClient()` bypasses RLS and is for the anonymous
  scan path (`/r/{code}`) and background jobs only.
- `middleware.ts` gates `/app/*` and `/onboarding`. The path rules live in
  `src/lib/routes.ts` so they can be unit-tested; `/r/{code}` stays public
  because customers scanning a code have no account.
- Authorize on `auth.getUser()`, never `getSession()` — the latter only decodes
  a cookie the client can write.
- `profiles` is filled by an `on auth.users` trigger and onboarding goes through
  `app_create_organization()` (both in `0004_auth.sql`). `organizations` has no
  insert policy on purpose; that function is the only way in.
- Dashboard routes are `force-dynamic`. They render per user, and their figures
  are relative to today — prerendered HTML stops matching the client the moment
  the date rolls over, which makes React discard the whole server tree.
- Migrations are tracked in `schema_migrations` with a checksum. Never edit one
  that has run — the runner will refuse it. Write a new one.
- Row level security cannot restrict columns. Where a policy needs to allow
  updating some fields and not others (feedback triage), that is a column
  `GRANT`, not a policy.
- Scan codes come from `generatePublicId()` — crypto-random, 10 chars. Never
  `Math.random()`, and never derived from anything readable. The printed
  `RD-LL-TH-T04` reference is a label only and is never used for lookups.

## The customer flow

- `src/app-actions/feedback.ts` records the whole journey: scan → session →
  feedback → draft → approval → destination click. Every action takes the
  `public_id` from the URL and **re-resolves the campaign server-side**; it never
  accepts an organization or outlet from the caller. Ids the client carries
  between steps are each checked against that campaign before use.
- `source_text` on a draft is read from the feedback row, never from the
  payload — it is the provenance of the whole thing. `edited_by_customer` is
  derived by comparing against the stored draft, for the same reason.
- `destination_url` on a review event comes from the outlet's configured
  destinations, not from the request.
- Writes in this path never break the customer: they fail quietly, but through
  `attempt()` in `src/lib/observability.ts`, which records one line of
  structured JSON first. Ids and counts only — never a comment, name, email or
  phone, which must not outlive the row in a log file.
- `visitor_hash` is `HMAC(VISITOR_SALT + UTC date, ip + user agent)`. The
  address is an input, never stored, and the daily rotation stops a device being
  followed across days. Without `VISITOR_SALT` it stays null rather than being
  faked.
- Rate limits are per process and prune (`src/lib/rate-limit.ts`). The scan
  limit is deliberately generous — a whole café shares one address — and when it
  trips the page still renders; only the telemetry write is dropped.

## Deploy pipeline

Live site: **reviewdot.in**, hosted on Hostinger as a **Node.js app deployment** (hPanel → Websites →
Deployments), not as static files in `public_html/`. `npm start` runs `server.js`, which serves the
Vite build in `dist/` with an SPA fallback.

- The CI `deploy` job FTP-uploads `dist/` to `public_html/`. **That path does not feed reviewdot.in**
  under the current hosting setup — a green deploy job is not proof the site changed.
- To ship to the live site, build a deployment bundle and upload it in hPanel → Deployments
  (or connect that deployment to this repo so it deploys on push):

  The app is now a real Next.js project, so the hosting deployment's Framework: Next.js setting
  matches it directly: `npm install && npm run build && npm start`. No wrapper bundle is needed —
  zip the repository (without `node_modules` and `.next`) for hPanel → Deployments, or point that
  deployment at the GitHub repo.

- The **default branch** is `claude/premium-ai-review-saas-vy8lou`; the CI `deploy` job runs only there.
- Feature work happens on `claude/amazing-rubin-enoruh`, then merges into the default branch.
- `deploy` runs only after `verify` passes: lint → unit tests → type-checked build → Playwright e2e.
- FTP credentials live in repo secrets (`FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`). They are never
  needed locally and must never be printed or committed.
- After any deploy, confirm the live site actually changed before reporting it as shipped.

### To ship a change

```bash
npm run lint && npm test && npm run build && npm run test:e2e   # all four must pass
git commit -am "…"
git push -u origin claude/amazing-rubin-enoruh                   # feature branch
git push origin HEAD:claude/premium-ai-review-saas-vy8lou        # ships it
```

Then watch the run in GitHub Actions and confirm the `deploy` job ends with "Sync complete".
Deploying to Hostinger replaces the live site, so confirm with the user before pushing to the
default branch unless they have just asked for a deploy.

## Conventions

- Routing is path-based (`/app`, `/r/{public_id}`) and server-rendered; marketing pages must stay
  crawlable, so keep their copy in server components rather than behind client-only rendering.
- `import.meta.env` is a Vite API and does not exist here — read `process.env.NEXT_PUBLIC_*`.
- Dashboard pages are **server components**. They resolve a scope from the query
  string, ask `DashboardRepo` for it, and pass the result to a presentational
  view. Never fetch or aggregate in a client component.
- Aggregation happens in Postgres (`0006_reporting.sql`), never in the browser.
  Nothing should fetch rows in order to count them.
- Those reporting functions are `security invoker` on purpose. A `security
  definer` one would hand any authenticated user every organization's numbers.
  They take `p_org`, but RLS is what authorizes the read — asking for another
  organization returns zeroes, and `reporting_test.sql` pins that.
- Lists page by **keyset** (`created_at, id`), never offset: feedback only ever
  grows at the front, so an offset repeats or skips rows between pages.
- The dashboard scope lives in the URL (`?range=&outlet=`), because the server
  has to read it before it renders. The client store still holds it in demo mode
  only.
- Demo mode keeps reading `src/lib/metrics.ts` through `DemoDashboardRepo`, so
  the reference figures stay exact. Pages still on seeded data carry
  `<SeededNotice />`; delete that line when the page's queries land, and when
  none are left delete the component, `src/lib/data.ts` and the demo views.
- The 30-day demo window reproduces the product's reference figures exactly (1,248 scans, 326 reviews,
  4.7★, 26.1%, and the product table). `src/lib/data.test.ts` asserts them — if a change moves those
  numbers, that is a bug in the change, not the test.
- QR codes render dark-on-light in both themes; inverted codes fail on many phone scanners.
- Chart colours come from the validated tokens in `src/index.css` (`--color-chart-*`, `--color-rank-*`).
  New series use the next token, never an ad-hoc hex.

## Commands

```bash
npm run dev        # next dev
npm run build      # next build
npm start          # next start
npm run lint
npm test           # Vitest
npm run test:e2e   # Playwright (builds and starts the app itself)
npm run db:migrate # apply outstanding migrations (tracked, once each)
npm run db:test    # 138 database checks: isolation, auth, policy, flow, reporting
```
