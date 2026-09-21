# ReviewDot — working notes for Claude

QR-powered Customer Experience & Review Intelligence platform.
React 18 · TypeScript · Vite · Tailwind v4 · Zustand · React Router · Vitest · Playwright.

## Deploy pipeline

Live site: **reviewdot.in**, hosted on Hostinger as a **Node.js app deployment** (hPanel → Websites →
Deployments), not as static files in `public_html/`. `npm start` runs `server.js`, which serves the
Vite build in `dist/` with an SPA fallback.

- The CI `deploy` job FTP-uploads `dist/` to `public_html/`. **That path does not feed reviewdot.in**
  under the current hosting setup — a green deploy job is not proof the site changed.
- To ship to the live site, build the deployment bundle and upload it in hPanel → Deployments
  (or connect that deployment to this repo so it deploys on push):

```bash
npm run build && npm run bundle    # writes reviewdot-hostinger.zip (dist/ + server.js + package.json)
```

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

- Routing is **hash-based** (`/#/app`, `/#/r/:code`), so Hostinger needs no rewrite rules. Changing
  to path routing would require an `.htaccess` rewrite as well.
- All screens read one dataset through `src/lib/metrics.ts`; never fetch or compute stats in a page.
  Replacing `src/lib/data.ts` with API calls is the path to a real backend — the types in
  `src/lib/types.ts` are the contract.
- The 30-day demo window reproduces the product's reference figures exactly (1,248 scans, 326 reviews,
  4.7★, 26.1%, and the product table). `src/lib/data.test.ts` asserts them — if a change moves those
  numbers, that is a bug in the change, not the test.
- QR codes render dark-on-light in both themes; inverted codes fail on many phone scanners.
- Chart colours come from the validated tokens in `src/index.css` (`--color-chart-*`, `--color-rank-*`).
  New series use the next token, never an ad-hoc hex.

## Commands

```bash
npm run dev            # dev server
npm run build          # tsc -b + vite build
npm run build:preview  # single-file bundle (fonts inlined) for a self-contained preview
npm run lint
npm test               # Vitest
npm run test:e2e       # Playwright
```
