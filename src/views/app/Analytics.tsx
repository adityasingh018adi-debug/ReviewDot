'use client'

import { useMemo } from 'react'
import { Download, ExternalLink, MessageSquareWarning, Percent, Star } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrendChart } from '@/components/charts/TrendChart'
import { BarChart, RankedBars } from '@/components/charts/BarChart'
import { Donut } from '@/components/charts/Donut'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { byOutlet, byProduct, entriesIn, overview, ratingDistribution, seriesFor } from '@/lib/metrics'
import { useDataSet, useScope } from '@/store/app'
import { downloadCSV } from '@/lib/export'
import { formatNumber, formatPercent } from '@/lib/utils'

const RANK_COLORS = [
  'var(--color-rank-1)',
  'var(--color-rank-2)',
  'var(--color-rank-3)',
  'var(--color-rank-4)',
  'var(--color-rank-5)',
]

export function Analytics() {
  const scope = useScope()
  const data = useDataSet()

  const stats = useMemo(() => overview(scope, data), [scope, data])
  const series = useMemo(() => seriesFor(scope, data), [scope, data])
  const entries = useMemo(() => entriesIn(scope, data), [scope, data])
  const outletRows = useMemo(() => byOutlet(scope, data), [scope, data])
  const productRows = useMemo(() => byProduct(scope, data), [scope, data])
  const distribution = useMemo(() => ratingDistribution(entries), [entries])

  const conversionSeries = series.map((point) => (point.scans ? (point.reviews / point.scans) * 100 : 0))
  const clicksByDay = useMemo(() => {
    const byDay = new Map(series.map((point) => [point.date, 0]))
    for (const entry of entries) {
      if (!entry.publicClick) continue
      const key = entry.createdAt.slice(0, 10)
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1)
    }
    return [...byDay.values()]
  }, [entries, series])
  const feedbackByDay = useMemo(() => {
    const byDay = new Map(series.map((point) => [point.date, 0]))
    for (const entry of entries) {
      if (entry.kind !== 'feedback') continue
      const key = entry.createdAt.slice(0, 10)
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1)
    }
    return [...byDay.values()]
  }, [entries, series])

  const exportAll = () =>
    downloadCSV(
      series.map((point, index) => ({
        date: point.date,
        scans: point.scans,
        reviews: point.reviews,
        conversion: `${conversionSeries[index].toFixed(1)}%`,
        public_clicks: clicksByDay[index] ?? 0,
        feedback: feedbackByDay[index] ?? 0,
      })),
      'reviewdot-analytics.csv',
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`${scope.range.label} · use the date range and outlet selectors in the top bar to slice every chart`}
        action={
          <Button variant="secondary" size="sm" onClick={exportAll}>
            <Download size={15} /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Review conversion"
          numeric={stats.conversion}
          format={(value) => formatPercent(value)}
          trend={stats.trends.conversion}
          icon={Percent}
          series={conversionSeries}
        />
        <KpiCard
          label="Public review clicks"
          numeric={stats.googleClicks}
          format={formatNumber}
          trend={stats.trends.googleClicks}
          icon={ExternalLink}
          series={clicksByDay}
        />
        <KpiCard
          label="Private feedback"
          numeric={stats.feedback}
          format={formatNumber}
          trend={stats.trends.feedback}
          icon={MessageSquareWarning}
          series={feedbackByDay}
          invertTrend
        />
        <KpiCard
          label="Average rating"
          numeric={stats.rating}
          format={(value) => `${value.toFixed(2)} ★`}
          trend={stats.trends.rating}
          icon={Star}
        />
      </div>

      <Card>
        <CardHeader title="Reviews and scans over time" subtitle="Every scan, and the share that became a review" />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Review conversion" subtitle="Share of scans that ended in a rating" />
          <TrendChart
            labels={series.map((point) => point.date)}
            series={[
              {
                key: 'conversion',
                label: 'Conversion',
                color: 'var(--color-chart-1)',
                values: conversionSeries,
                fill: true,
              },
            ]}
            height={220}
            valueFormat={(value) => `${value.toFixed(0)}%`}
            caption="Scan to review conversion per day"
          />
        </Card>

        <Card>
          <CardHeader title="Public review clicks" subtitle="Customers who continued to Google or Instagram" />
          <TrendChart
            labels={series.map((point) => point.date)}
            series={[
              {
                key: 'clicks',
                label: 'Clicks',
                color: 'var(--color-chart-2)',
                values: clicksByDay,
                fill: true,
              },
            ]}
            height={220}
            caption="Public review clicks per day"
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rating distribution" subtitle={`${formatNumber(entries.length)} ratings`} />
          <Donut
            data={distribution.map((row, index) => ({
              label: `${row.rating} star${row.rating > 1 ? 's' : ''}`,
              value: row.count,
              color: RANK_COLORS[index],
            }))}
            centerLabel="average"
            centerValue={`${stats.rating.toFixed(1)}★`}
          />
        </Card>

        <Card>
          <CardHeader title="Feedback volume" subtitle="Private ratings of 3★ and below, per day" />
          <TrendChart
            labels={series.map((point) => point.date)}
            series={[
              {
                key: 'feedback',
                label: 'Private feedback',
                color: 'var(--color-chart-3)',
                values: feedbackByDay,
                fill: true,
              },
            ]}
            height={220}
            caption="Private feedback per day"
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Reviews by outlet" subtitle="Volume and conversion side by side" />
          <BarChart
            data={outletRows.map((row) => ({
              label: row.name,
              value: row.reviews,
              hint: `${formatPercent(row.conversion, 1)} conversion · ${row.rating.toFixed(1)}★`,
            }))}
            caption="Reviews by outlet"
          />
        </Card>

        <Card>
          <CardHeader title="Reviews by product" subtitle="Top products in this period" />
          <RankedBars
            data={productRows.slice(0, 8).map((row) => ({
              label: row.name,
              value: row.reviews,
              hint: `${row.rating.toFixed(1)}★`,
            }))}
            caption="Reviews by product"
          />
        </Card>
      </div>
    </div>
  )
}
