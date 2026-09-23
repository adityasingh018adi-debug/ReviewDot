import Link from 'next/link'
import { ArrowRight, BarChart3, MessageSquare, ScanLine, Star } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { Donut } from '@/components/charts/Donut'
import { RankedBars } from '@/components/charts/BarChart'
import { Empty } from '@/components/ui/Empty'
import { Stars } from '@/components/ui/Stars'
import { formatNumber, formatPercent } from '@/lib/utils'
import type { FeedbackItem, OutletRow, OverviewStats, RatingBucket, SeriesPoint } from '@/services/dashboard'

/**
 * The dashboard for a real workspace.
 *
 * It renders what the database can actually answer and nothing else. Product
 * intelligence and AI insights are not here yet, so rather than borrowing the
 * demo's figures for those panels — which would put invented numbers inside a
 * paying customer's account — they are absent, and the page says why.
 *
 * The seeded Dashboard view still exists for demo mode and goes away once every
 * panel here is backed by a query.
 */

const RANK_COLORS = [
  'var(--color-rank-1)',
  'var(--color-rank-2)',
  'var(--color-rank-3)',
  'var(--color-rank-4)',
  'var(--color-rank-5)',
]

export function DashboardLive({
  organizationName,
  rangeLabel,
  outletLabel,
  stats,
  series,
  outlets,
  distribution,
  recent,
}: {
  organizationName: string
  rangeLabel: string
  outletLabel: string
  stats: OverviewStats
  series: SeriesPoint[]
  outlets: OutletRow[]
  distribution: RatingBucket[]
  recent: FeedbackItem[]
}) {
  const nothingYet = stats.scans === 0 && stats.reviews === 0

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`${organizationName} · ${rangeLabel} · ${outletLabel}`} />

      {nothingYet ? (
        <Card>
          <Empty
            title="No activity in this period yet"
            detail="Print a QR code and put it where your customers are. Scans and reviews appear here as they come in — usually the same day."
            action={
              <Link
                href="/app/campaigns"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
              >
                Create a QR campaign <ArrowRight size={14} />
              </Link>
            }
          />
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="QR Scans"
          numeric={stats.scans}
          format={formatNumber}
          trend={stats.trends.scans}
          icon={ScanLine}
          series={series.map((point) => point.scans)}
        />
        <KpiCard
          label="Reviews"
          numeric={stats.reviews}
          format={formatNumber}
          trend={stats.trends.reviews}
          icon={MessageSquare}
          series={series.map((point) => point.reviews)}
        />
        <KpiCard
          label="Average Rating"
          numeric={stats.rating ?? 0}
          format={(value) => (stats.rating === null ? '—' : `${value.toFixed(1)} ★`)}
          trend={stats.trends.rating}
          icon={Star}
        />
        <KpiCard
          label="Review Conversion"
          numeric={stats.conversion ?? 0}
          format={(value) => (stats.conversion === null ? '—' : formatPercent(value))}
          trend={stats.trends.conversion}
          icon={BarChart3}
        />
      </div>

      <Card>
        <CardHeader
          title="Scans and reviews"
          subtitle={`${formatNumber(stats.scans)} scans produced ${formatNumber(stats.reviews)} reviews`}
        />
        <TrendChart
          labels={series.map((point) => point.date)}
          series={[
            {
              key: 'scans',
              label: 'QR scans',
              color: 'var(--color-chart-2)',
              values: series.map((point) => point.scans),
              fill: true,
            },
            {
              key: 'reviews',
              label: 'Reviews',
              color: 'var(--color-chart-1)',
              values: series.map((point) => point.reviews),
              fill: true,
            },
          ]}
          caption="QR scans and reviews per day"
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Outlet performance" subtitle="Reviews collected this period" />
          {outlets.length ? (
            <>
              <RankedBars
                data={outlets.map((outlet) => ({
                  label: outlet.name,
                  value: outlet.reviews,
                  hint:
                    outlet.rating === null
                      ? 'no feedback yet'
                      : `${outlet.rating.toFixed(1)}★ · ${formatNumber(outlet.scans)} scans`,
                }))}
                caption="Reviews by outlet"
              />
              <Link
                href="/app/outlets"
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
              >
                Compare outlets <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <Empty title="No outlets yet" detail="Add an outlet to start collecting feedback against it." />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Rating distribution"
            subtitle={`${formatNumber(stats.reviews)} ratings collected`}
          />
          {stats.reviews ? (
            <Donut
              data={distribution.map((row, index) => ({
                label: `${row.rating} star${row.rating > 1 ? 's' : ''}`,
                value: row.count,
                color: RANK_COLORS[index],
              }))}
              size={156}
              centerLabel="average"
              centerValue={stats.rating === null ? '—' : `${stats.rating.toFixed(1)}★`}
            />
          ) : (
            <Empty title="No ratings in this period" detail="Ratings appear here as customers leave them." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Latest feedback"
          subtitle="Newest ratings across every QR code"
          action={
            <Link href="/app/feedback" className="text-[13px] font-medium text-accent hover:underline">
              All feedback
            </Link>
          }
        />
        {recent.length ? (
          <div className="space-y-3">
            {recent.map((item) => (
              <FeedbackLine key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty title="Nothing yet" detail="The first feedback from a scan will show up here." />
        )}
      </Card>
    </div>
  )
}

export function FeedbackLine({ item }: { item: FeedbackItem }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={item.rating} size={14} />
          {item.outletName ? <span className="text-[12px] text-muted">{item.outletName}</span> : null}
          {item.productName ? <span className="text-[12px] text-faint">· {item.productName}</span> : null}
          <span className="ml-auto text-[11px] text-faint">
            {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        </div>
        {item.comment ? (
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">{item.comment}</p>
        ) : null}
        {item.tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-full bg-raised px-2 py-0.5 text-[11px] text-muted">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
