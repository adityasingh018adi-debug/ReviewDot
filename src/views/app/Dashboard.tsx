'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, BarChart3, MessageSquare, QrCode, ScanLine, Star } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { InsightList } from '@/components/dashboard/InsightList'
import { EntryRow } from '@/components/dashboard/EntryRow'
import { TrendChart } from '@/components/charts/TrendChart'
import { Donut } from '@/components/charts/Donut'
import { RankedBars } from '@/components/charts/BarChart'
import { businessInsights } from '@/lib/insights'
import { byOutlet, byProduct, entriesIn, overview, ratingDistribution, seriesFor } from '@/lib/metrics'
import { useDataSet, useScope } from '@/store/app'
import { formatNumber, formatPercent } from '@/lib/utils'

const RANK_COLORS = [
  'var(--color-rank-1)',
  'var(--color-rank-2)',
  'var(--color-rank-3)',
  'var(--color-rank-4)',
  'var(--color-rank-5)',
]

export function Dashboard() {
  const scope = useScope()
  const data = useDataSet()

  const stats = useMemo(() => overview(scope, data), [scope, data])
  const series = useMemo(() => seriesFor(scope, data), [scope, data])
  const products = useMemo(() => byProduct(scope, data), [scope, data])
  const outletRows = useMemo(() => byOutlet(scope, data), [scope, data])
  const entries = useMemo(() => entriesIn(scope, data), [scope, data])
  const insights = useMemo(() => businessInsights(scope, data), [scope, data])
  const distribution = useMemo(() => ratingDistribution(entries), [entries])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${scope.range.label} · ${scope.outletId === 'all' ? 'all outlets' : outletRows.find((o) => o.id === scope.outletId)?.name}`}
        action={
          <>
            <ButtonLink href="/app/qr" variant="secondary" size="sm">
              <QrCode size={15} /> QR studio
            </ButtonLink>
            <ButtonLink href="/app/insights" size="sm">
              AI insights <ArrowRight size={15} />
            </ButtonLink>
          </>
        }
      />

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
          numeric={stats.rating}
          format={(value) => `${value.toFixed(1)} ★`}
          trend={stats.trends.rating}
          icon={Star}
        />
        <KpiCard
          label="Review Conversion"
          numeric={stats.conversion}
          format={(value) => formatPercent(value)}
          trend={stats.trends.conversion}
          icon={BarChart3}
        />
      </div>

      <Card>
        <CardHeader
          title="Scans and reviews"
          subtitle={`${formatNumber(stats.scans)} scans produced ${formatNumber(stats.reviews)} reviews`}
          action={
            <Link href="/app/analytics" className="text-[13px] font-medium text-accent hover:underline">
              Full analytics
            </Link>
          }
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
        <Card className="lg:col-span-2">
          <CardHeader
            title="Product intelligence"
            subtitle="Which products your customers are actually reviewing"
            action={
              <Link href="/app/products" className="text-[13px] font-medium text-accent hover:underline">
                All products
              </Link>
            }
          />
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-2 py-2.5 font-medium">Product</th>
                  <th className="px-2 py-2.5 text-right font-medium">Reviews</th>
                  <th className="px-2 py-2.5 text-right font-medium">Rating</th>
                  <th className="px-2 py-2.5 text-right font-medium" title="Share of feedback chips that were positive">
                    Positive feedback
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 6).map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-2 py-3">
                      <Link
                        href={`/app/products/${row.id}`}
                        className="flex items-center gap-2.5 text-[14px] font-medium text-ink hover:text-accent"
                      >
                        <span aria-hidden className="text-lg">
                          {row.emoji}
                        </span>
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-ink-soft">{row.reviews}</td>
                    <td className="px-2 py-3 text-right text-[14px] font-medium tabular-nums text-ink">
                      {row.rating.toFixed(1)}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-brand-600">
                      {Math.round(row.positive * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Rating distribution" subtitle={`${formatNumber(entries.length)} ratings collected`} />
          <Donut
            data={distribution.map((row, index) => ({
              label: `${row.rating} star${row.rating > 1 ? 's' : ''}`,
              value: row.count,
              color: RANK_COLORS[index],
            }))}
            size={156}
            centerLabel="average"
            centerValue={`${stats.rating.toFixed(1)}★`}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Outlet performance" subtitle="Reviews collected this period" />
          <RankedBars
            data={outletRows.map((outlet) => ({
              label: outlet.name,
              value: outlet.reviews,
              hint: `${outlet.rating.toFixed(1)}★ · ${formatPercent(outlet.conversion, 1)} conversion`,
            }))}
            caption="Reviews by outlet"
          />
          <Link
            href="/app/outlets"
            className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
          >
            Compare outlets <ArrowRight size={14} />
          </Link>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="AI insights"
            subtitle="Generated from this period's reviews and feedback"
            action={<Badge tone="positive">Live</Badge>}
          />
          <InsightList cards={insights} limit={3} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Latest activity"
          subtitle="Newest ratings across every QR code"
          action={
            <Link href="/app/reviews" className="text-[13px] font-medium text-accent hover:underline">
              All reviews
            </Link>
          }
        />
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      </Card>
    </div>
  )
}
