# ReviewDot — Customer Experience & Review Intelligence

**Every Scan Can Become a Review.**
_Collect. Understand. Improve. Grow._

ReviewDot is a QR-powered customer experience platform for restaurants, cafés, retail and multi-outlet
brands. A customer scans a code on the table, bill or packaging, rates the specific product in ten
seconds, and the business gets reviews, private feedback and product-level intelligence.

```
SCAN → RATE → FEEDBACK → REVIEW → INSIGHT → ACTION
```

## Quick start

```bash
npm install
npm run dev        # dev server
npm run build      # type-check + production build
npm start          # serve the production build
npm run lint       # ESLint
npm test           # Vitest unit tests
npm run test:e2e   # Playwright end-to-end tests
```

## What's in the product

**Marketing site** — landing page (hero, stats, four-step flow, live customer journey, QR system,
dashboard preview), plus Product, Solutions, Pricing and Resources pages, and log-in / sign-up.

**Customer experience** (`/#/r/:code`) — rate a product, pick feedback chips, then either continue to a
public platform or send private feedback to the team. Happy customers are invited, never forced;
unhappy customers are never blocked from reviewing publicly.

**QR studio** — outlet, table, product, packaging, bill and campaign codes. Generate, download as PNG
or SVG, print a ready-made table card (print → PDF), copy the short link, and re-point or pause any
code without reprinting it.

**Dashboard** — QR scans, reviews, average rating and review conversion with period-over-period trends;
scan/review time series; product intelligence table; rating distribution; outlet performance;
AI insights; live activity.

**Pages** — Dashboard, Reviews, Feedback, Products (+ per-product analytics), Outlets, QR Codes,
Customers, Analytics, AI Insights, Campaigns, Settings.

**AI review intelligence** — per-product summaries, positive/negative keyword mining, clustered feedback
themes with outlet attribution, ranked insight cards and an assistant. Everything is computed from the
workspace's own reviews. Adding an Anthropic API key in Settings routes the assistant through Claude;
without one, the built-in analyst answers from the same data.

## How the numbers work

The demo workspace (Love & Latte, three outlets) is generated deterministically at load. The last
30 days reproduce the product's reference figures exactly — 1,248 scans, 326 reviews, 4.7★ average,
26.1% conversion, and the product table (Mango Cheesecake 86 / 4.9 / 91%, Tiramisu 72 / 4.8 / 89%,
Caesar Salad 54 / 4.6 / 84%, Croissant 43 / 4.5 / 81%) — and `src/lib/data.test.ts` asserts them.

Every screen reads from one dataset (`src/lib/metrics.ts`), so filters, charts, tables and insights
always agree. Feedback submitted through the scan experience is merged into that dataset live, which is
why a rating left on `/#/r/demo` shows up on the Feedback page immediately.

Swapping in a real backend means replacing `src/lib/data.ts` with API calls; the metric, insight and UI
layers consume the same `Entry` / `ScanEvent` / `QRCodeRecord` types (`src/lib/types.ts`).

## QR codes

`src/lib/qr.ts` is a dependency-free QR encoder (byte mode, ECC level M, versions 1–10) with
Reed–Solomon error correction, all eight mask patterns and penalty-based mask selection. Its output is
verified in `src/lib/qr.test.ts` by rendering the matrix to a bitmap and decoding it with jsQR, across
payload lengths from 5 to 200 bytes. Codes always render dark-on-light, in both themes, so phone
scanners can read them.

Printed links use the `reviewdot.in/r/<code>` form; in this build the encoded URL points back at the
running app, so the codes on screen are genuinely scannable.

## Data visualisation

Charts are hand-rolled SVG (`src/components/charts`) with crosshair tooltips, screen-reader tables and
recessive grids. The three-slot categorical palette and the 5★→1★ ordinal ramp are validated for
lightness band, chroma, CVD separation and contrast against both the light (`#ffffff`) and dark
(`#0e1211`) chart surfaces.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Zustand · React Router ·
Anthropic SDK (optional, lazy-loaded) · Vitest · Playwright

## Structure

```
src/
  components/
    charts/      SVG trend, bar, donut and sparkline charts
    dashboard/   KPI cards, insight list, review rows
    layout/      app shell, sidebar, topbar, error boundary
    marketing/   site nav/footer, hero visual, phone frames
    qr/          QR preview and the printable table card
    review/      the customer scan experience
    ui/          buttons, cards, fields, modal, stars, badges
  lib/           qr encoder, dataset, metrics, insights, ai, export, links
  pages/         marketing/, app/, scan page, 404
  store/         persisted workspace state (zustand)
e2e/             Playwright smoke tests
```

## Deploying

reviewdot.in runs on Hostinger as a **Node.js app deployment** (hPanel → Websites → Deployments),
not as static files in `public_html/`. This is a Next.js app with middleware, server actions and
dynamic routes, so it needs a Node process — there is no static bundle to upload:

```
Framework: Next.js
npm install && npm run build && npm start
```

Either zip the repository (without `node_modules` and `.next`) and upload it there, or point that
deployment at this repository so it ships on push to the default branch
(`claude/premium-ai-review-saas-vy8lou`).

Apply any outstanding database migrations before the new code serves traffic, or it will call
functions that do not exist yet:

```bash
DATABASE_URL="…" npm run db:migrate
```

CI does **not** deploy. It used to FTP `dist/` to `public_html/`, which worked while this was a Vite
SPA and cannot work now: `next build` produces `.next/`, and a Next.js app is not files you copy —
it is a process you run. That job was removed rather than repointed, because nothing about FTP can
start one.

After a deploy, confirm the live site actually changed before calling it shipped.

## Notes

- Hero stats (10K+ / 1M+ / 4.8★) and testimonials are illustrative placeholders for the marketing page.
- The model key is server-side only. AI runs behind `/api/ai/*` and the browser never holds a key;
  an e2e test greps every client bundle for `anthropic` and `sk-ant` to keep that true.
- CI runs lint, unit tests, a type-checked build and the Playwright suite on every branch. Deployment
  is a separate, manual step — see above.
