import { Suspense, lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { Landing } from '@/pages/marketing/Landing'
import { NotFound } from '@/pages/NotFound'
import { ScanPage } from '@/pages/ScanPage'
import { useThemeEffect } from '@/lib/hooks'

// marketing sub-pages and the dashboard are code-split; the landing page ships first
const Product = lazy(() => import('@/pages/marketing/Product').then((m) => ({ default: m.Product })))
const Solutions = lazy(() => import('@/pages/marketing/Solutions').then((m) => ({ default: m.Solutions })))
const Pricing = lazy(() => import('@/pages/marketing/Pricing').then((m) => ({ default: m.Pricing })))
const Resources = lazy(() => import('@/pages/marketing/Resources').then((m) => ({ default: m.Resources })))
const Login = lazy(() => import('@/pages/marketing/Auth').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/marketing/Auth').then((m) => ({ default: m.Signup })))

const Dashboard = lazy(() => import('@/pages/app/Dashboard').then((m) => ({ default: m.Dashboard })))
const Reviews = lazy(() => import('@/pages/app/Reviews').then((m) => ({ default: m.Reviews })))
const Feedback = lazy(() => import('@/pages/app/Feedback').then((m) => ({ default: m.Feedback })))
const Products = lazy(() => import('@/pages/app/Products').then((m) => ({ default: m.Products })))
const ProductDetail = lazy(() =>
  import('@/pages/app/ProductDetail').then((m) => ({ default: m.ProductDetail })),
)
const Outlets = lazy(() => import('@/pages/app/Outlets').then((m) => ({ default: m.Outlets })))
const QRCodes = lazy(() => import('@/pages/app/QRCodes').then((m) => ({ default: m.QRCodes })))
const Customers = lazy(() => import('@/pages/app/Customers').then((m) => ({ default: m.Customers })))
const Analytics = lazy(() => import('@/pages/app/Analytics').then((m) => ({ default: m.Analytics })))
const Insights = lazy(() => import('@/pages/app/Insights').then((m) => ({ default: m.Insights })))
const Campaigns = lazy(() => import('@/pages/app/Campaigns').then((m) => ({ default: m.Campaigns })))
const Settings = lazy(() => import('@/pages/app/Settings').then((m) => ({ default: m.Settings })))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

export default function App() {
  useThemeEffect()

  return (
    <ErrorBoundary>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route index element={<Landing />} />
            <Route
              path="product"
              element={
                <Lazy>
                  <Product />
                </Lazy>
              }
            />
            <Route
              path="solutions"
              element={
                <Lazy>
                  <Solutions />
                </Lazy>
              }
            />
            <Route
              path="pricing"
              element={
                <Lazy>
                  <Pricing />
                </Lazy>
              }
            />
            <Route
              path="resources"
              element={
                <Lazy>
                  <Resources />
                </Lazy>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/login"
            element={
              <Lazy>
                <Login />
              </Lazy>
            }
          />
          <Route
            path="/signup"
            element={
              <Lazy>
                <Signup />
              </Lazy>
            }
          />

          <Route path="/r/:code" element={<ScanPage />} />
          <Route path="/r" element={<Navigate to="/" replace />} />

          <Route path="/app" element={<AppLayout />}>
            <Route
              index
              element={
                <Lazy>
                  <Dashboard />
                </Lazy>
              }
            />
            <Route
              path="reviews"
              element={
                <Lazy>
                  <Reviews />
                </Lazy>
              }
            />
            <Route
              path="feedback"
              element={
                <Lazy>
                  <Feedback />
                </Lazy>
              }
            />
            <Route
              path="products"
              element={
                <Lazy>
                  <Products />
                </Lazy>
              }
            />
            <Route
              path="products/:productId"
              element={
                <Lazy>
                  <ProductDetail />
                </Lazy>
              }
            />
            <Route
              path="outlets"
              element={
                <Lazy>
                  <Outlets />
                </Lazy>
              }
            />
            <Route
              path="qr"
              element={
                <Lazy>
                  <QRCodes />
                </Lazy>
              }
            />
            <Route
              path="customers"
              element={
                <Lazy>
                  <Customers />
                </Lazy>
              }
            />
            <Route
              path="analytics"
              element={
                <Lazy>
                  <Analytics />
                </Lazy>
              }
            />
            <Route
              path="insights"
              element={
                <Lazy>
                  <Insights />
                </Lazy>
              }
            />
            <Route
              path="campaigns"
              element={
                <Lazy>
                  <Campaigns />
                </Lazy>
              }
            />
            <Route
              path="settings"
              element={
                <Lazy>
                  <Settings />
                </Lazy>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
