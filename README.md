# ReviewDot — AI Review Intelligence

An enterprise-grade AI review management platform with an immersive, cinematic interface: floating glass panels, 3D depth, live-updating analytics, and a conversational AI assistant.

## Quick start

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Highlights

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

React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Zustand · React Router

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

All data is simulated in-memory so the product experience can be explored end-to-end without a backend.
