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
import type { TagRow } from '@/services/dashboard'

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

  // This product's own distribution and tags, narrowed in the database rather
  // than by filtering a page of rows — which would describe the page, not the
  // product.
  const [feedback, distribution, tags] = await Promise.all([
    context.repo.feedback(scope, { productId, limit: 20 }),
    context.repo.ratingDistribution(scope, productId),
    context.repo.tags(scope, productId),
  ])

  // A tag is "liked" or "complained about" by the rating of the feedback it
  // appeared in, not by the word itself: "Portion Size" is praise at five stars
  // and a complaint at two, and guessing from the word would get it backwards.
  // avgRating is null when nothing behind the tag carried a rating, which is
  // neither praise nor a complaint — such a tag belongs in neither panel.
  const rated = tags.filter(
    (tag): tag is TagRow & { avgRating: number } => tag.mentions >= 2 && tag.avgRating !== null,
  )
  const liked = rated.filter((tag) => tag.avgRating >= 4).slice(0, 6)
  const criticised = rated.filter((tag) => tag.avgRating < 4).slice(0, 6)

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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Rating distribution" subtitle={`${formatNumber(product.reviews)} ratings`} />
          {product.reviews ? (
            <ul className="space-y-2.5">
              {[...distribution].reverse().map((bucket) => (
                <li key={bucket.rating} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-[12px] tabular-nums text-muted">
                    {bucket.rating}★
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(bucket.share * 100)}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-ink-soft">
                    {formatNumber(bucket.count)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">No ratings in this range.</p>
          )}
        </Card>

        <TagPanel
          title="What they liked"
          subtitle="Tags on feedback rated 4★ and above"
          tags={liked}
          tone="positive"
        />
        <TagPanel
          title="What they raised"
          subtitle="Tags on feedback rated below 4★"
          tags={criticised}
          tone="negative"
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

/**
 * Tags, split by the rating of the feedback they appeared in.
 *
 * Nothing here is generated — these are the chips customers actually chose, and
 * the figure beside each is how many chose it. A panel with nothing behind it
 * says so rather than showing an empty box.
 */
function TagPanel({
  title,
  subtitle,
  tags,
  tone,
}: {
  title: string
  subtitle: string
  tags: { tag: string; mentions: number; avgRating: number }[]
  tone: 'positive' | 'negative'
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {tags.length ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.tag}
              className={
                tone === 'positive'
                  ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700'
                  : 'rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-700'
              }
            >
              {tag.tag}
              <span className="ml-1.5 tabular-nums opacity-70">{tag.mentions}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] leading-relaxed text-muted">
          Not enough tagged feedback here yet to say anything worth saying.
        </p>
      )}
    </Card>
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
