# ReviewDot — AI Business Reputation Platform

**Monitor Reviews. Understand Customers. Grow Your Business with AI.**

ReviewDot turns customer reviews from Google, Facebook, TripAdvisor, and Trustpilot into decisions a business owner can act on — built for clinics, restaurants, hotels, salons, gyms, and retail stores.

## Quick start

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run preview   # serve the production build
npm run lint      # ESLint
npm test          # Vitest unit tests
npm run test:e2e  # Playwright smoke tests
```

## What it does

**🤖 AI** — every feature adapts to your business type:
- **AI Business Health Score** — one graded number blending rating, response coverage, sentiment momentum, and review velocity
- **AI Action Suggestions** — industry-specific opportunities, risks, and trends with one-click actions
- **AI Review Summary & Reply Generator** — per-review summaries and tone-matched suggested replies, streamed live from Claude when you add an API key (Settings → Claude connection; falls back to a built-in simulation without one)
- **Sentiment Analysis** — positive/neutral/negative split with drill-down
- **Aria, your AI business advisor** — conversational assistant grounded in your business data

**📊 Analytics** — rating trends, review growth, top complaint topics (AI-extracted), customer satisfaction (CSAT) score, platform share, response time.

**📋 Review workflow** — AI summary, suggested reply, internal team notes, editable tags, and an Open → Replied → Closed status pipeline. Every action persists.

**🏢 Business types** — Clinic, Restaurant, Hotel, Salon, Gym, Retail Store. Pick yours during onboarding (or in Settings) and the reviews, complaint analysis, action suggestions, and AI advice all re-tune to your industry.

**👥 Team** — members, roles (Owner / Manager / Agent / Analyst), a permissions matrix, and an activity log.

**🔔 Notifications** — new review alerts, negative review alerts, weekly reports.

**📄 Reports** — one-click **PDF** (print-optimized), **Excel** workbook, and **CSV** exports.

**⚙️ Integrations** — Google Business Profile, Facebook, TripAdvisor, Trustpilot.

Plus: dark & light themes, ⌘K command palette with fuzzy search, drag-and-drop dashboard widgets with persisted layout, error boundary, 404 page, full test suite, and CI with automatic GitHub Pages deploys.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Zustand · React Router · Anthropic SDK · Vitest · Playwright

## Structure

```
src/
  components/
    ai/         Aria assistant (orb + streaming chat)
    charts/     animated SVG charts (area, bar, donut, sparkline)
    dashboard/  health score, KPI cards, action suggestions, activity feed
    layout/     shell, sidebar, topbar, command palette, onboarding, toasts
    ui/         primitives (buttons, glass panels, badges, rings…)
  pages/        Dashboard, Reviews, Analytics, Team, Settings
  store/        persisted workspace + review-action state (zustand)
  lib/          business profiles, dataset generator, AI client, exports
```

Review data is simulated per business type so the product can be explored end-to-end without a backend; AI features become fully live once an Anthropic API key is added in Settings (the key stays in your browser).
