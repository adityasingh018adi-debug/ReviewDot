# ReviewDot — AI Review Intelligence

An enterprise-grade AI review management platform with an immersive, cinematic interface: floating glass panels, 3D depth, live-updating analytics, and a conversational AI assistant.

## Quick start

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

```bash
npm run lint      # ESLint
npm test          # Vitest unit tests
npm run test:e2e  # Playwright smoke tests
```

## Highlights

- **Real AI (bring your own key)** — add an Anthropic API key in Settings and Aria plus reply drafting run on live Claude models (Opus 4.8 / Sonnet 5 / Haiku 4.5) with true streaming; without a key everything gracefully falls back to a built-in simulation. The key is stored only in the browser.
- **Dual themes** — dark and light, persisted, switchable from the topbar or ⌘K palette.
- **Resilient** — global error boundary with recovery, 404 page, CI (lint + unit + e2e) with automatic GitHub Pages deploys.
- **Stateful demo** — approved replies and review statuses persist locally; CSV exports actually download.

- **Premium layout** — floating collapsible sidebar (state persisted), sticky top navigation with global search, ⌘K command palette, mobile bottom tab bar.
- **3D interface** — pointer-tracked tilt cards with light glare, parallax aurora background with floating abstract shapes, depth-layered glass panels.
- **Cinematic motion** — route entrance transitions, staggered component reveals, animated chart draw-ins, rolling counters, ripple buttons, skeleton loaders, spring-physics dropdowns and modals.
- **Living dashboard** — drag-and-drop widget grid (order persisted to localStorage), live-updating KPIs, realtime activity feed, AI insight cards with one-click actions.
- **AI experience** — floating assistant orb opens “Aria”: streaming responses, thinking indicator, suggestion chips, and simulated voice input.
- **Review management** — instant filtering, expandable review cards, AI summaries, streamed AI reply drafts with approve/regenerate flow.
- **Data visualization** — animated area/bar/donut charts, sparklines, progress rings, day×hour heatmap, geographic distribution.
- **Keyboard-first** — `⌘K` palette, `[` sidebar, `A` assistant, `1/2/3` page navigation, full arrow-key navigation in the palette.
- **Performance** — code-split routes, compositor-only animations, `prefers-reduced-motion` support, self-hosted fonts.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Zustand · React Router · Anthropic SDK · Vitest · Playwright

## Structure

```
src/
  components/
    ai/         assistant orb + streaming chat panel
    charts/     animated SVG charts (area, bar, donut, heatmap, sparkline)
    dashboard/  KPI cards, activity feed, AI insights
    layout/     shell, sidebar, topbar, command palette, onboarding, toasts
    ui/         primitives (buttons, glass panels, tilt cards, badges…)
  pages/        Dashboard, Reviews, Analytics, Settings
  store/        persisted workspace state (zustand)
  lib/          mock data, hooks, utilities
```

Review data is simulated in-memory so the product experience can be explored end-to-end without a backend; AI features become fully live once an Anthropic API key is added in Settings.
