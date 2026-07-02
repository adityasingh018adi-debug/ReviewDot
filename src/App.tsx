import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Dashboard } from '@/pages/Dashboard'
import { NotFound } from '@/pages/NotFound'
import { CardSkeleton } from '@/components/ui/Skeleton'

// secondary routes are code-split; the dashboard loads instantly
const Reviews = lazy(() => import('@/pages/Reviews').then((m) => ({ default: m.Reviews })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))
const Team = lazy(() => import('@/pages/Team').then((m) => ({ default: m.Team })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

function RouteFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route
              path="reviews"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Reviews />
                </Suspense>
              }
            />
            <Route
              path="analytics"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Analytics />
                </Suspense>
              }
            />
            <Route
              path="team"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Team />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Settings />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
