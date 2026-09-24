import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Empty } from '@/components/ui/Empty'
import { FeedbackLine } from '@/views/app/DashboardLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

export const metadata: Metadata = { title: 'Product' }

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<ScopeParams>
}) {
  const context = await dashboardContext()
  const { productId } = await params
  const scope = scopeFromParams(await searchParams)

  const products = await context.repo.products(scope)
  const product = products.find((entry) => entry.id === productId)
  if (!product) notFound()

  const feedback = await context.repo.feedback(scope, { productId, limit: 20 })

  return (
    <div className="space-y-6">
      <Link
        href="/app/products"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> All products
      </Link>

      <PageHeader
        title={product.name}
        description={[product.category, scope.range.label].filter(Boolean).join(' · ')}
      />

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Reviews" value={formatNumber(product.reviews)} />
        <Stat label="Rating" value={product.rating === null ? '—' : `${product.rating.toFixed(1)}★`} />
        <Stat
          label="Positive"
          value={product.reviews ? formatPercent(product.positive / product.reviews, 0) : '—'}
        />
        {/* 3★ and below: the part that never reached a public platform */}
        <Stat label="Private" value={formatNumber(product.privateFeedback)} />
        <Stat label="Scans" value={formatNumber(product.scans)} />
        <Stat
          label="Price"
          value={product.priceCents === null ? '—' : formatCurrency(product.priceCents / 100)}
        />
      </div>

      <Card>
        <CardHeader title="What customers said" subtitle="Feedback tied to this product" />
        {feedback.items.length ? (
          <div className="space-y-3">
            {feedback.items.map((item) => (
              <FeedbackLine key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty
            title="No feedback yet"
            detail="Point a QR code at this product and feedback from it will collect here."
          />
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tabular-nums text-ink">{value}</p>
    </Card>
  )
}
