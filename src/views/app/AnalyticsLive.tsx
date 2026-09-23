import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrendChart } from '@/components/charts/TrendChart'
import { RankedBars } from '@/components/charts/BarChart'
import { Donut } from '@/components/charts/Donut'
import { Empty } from '@/components/ui/Empty'
import { formatNumber, formatPercent } from '@/lib/utils'
import type { Funnel, OutletRow, RatingBucket, SeriesPoint, TagRow } from '@/services/dashboard'

/**
 * Analytics for a real workspace.
 *
 * The funnel is the point of the page: every step is a count the database
 * computed, so the drop-off between "scanned" and "posted" is measured rather
 * than estimated. Where a step is zero it says so — an empty funnel is a
 * finding, not something to hide behind a placeholder.
 */

const RANK_COLORS = [
  'var(--color-rank-1)',
  'var(--color-rank-2)',
  'var(--color-rank-3)',
  'var(--color-rank-4)',
  'var(--color-rank-5)',
]

export function AnalyticsLive({
  rangeLabel,
  outletLabel,
  series,
  funnel,
  tags,
  outlets,
  distribution,
}: {
  rangeLabel: string
  outletLabel: string
  series: SeriesPoint[]
  funnel: Funnel
  tags: TagRow[]
  outlets: OutletRow[]
  distribution: RatingBucket[]
}) {
  const steps = [
    { label: 'Scanned', value: funnel.scans },
    { label: 'Started', value: funnel.sessions },
    { label: 'Left feedback', value: funnel.feedback },
    { label: 'Got a draft', value: funnel.drafts },
    { label: 'Approved it', value: funnel.approved },
    { label: 'Went to post', value: funnel.clicks },
  ]
  const top = funnel.scans || 1
  const anything = funnel.scans > 0

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description={`${rangeLabel} · ${outletLabel}`} />

      <Card>
        <CardHeader
          title="Scan to review"
          subtitle="Where the journey loses people, counted at every step"
        />
        {anything ? (
          <div className="space-y-2.5">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[13px] text-ink-soft">{step.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-raised">
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{
                      width: `${Math.max(2, (step.value / top) * 100)}%`,
                      background: RANK_COLORS[Math.min(index, RANK_COLORS.length - 1)],
                    }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-[13px] font-medium tabular-nums text-ink">
                  {formatNumber(step.value)}
                  <span className="ml-1.5 text-[11px] text-faint">
                    {formatPercent(step.value / top, 0)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Nothing scanned yet" detail="The funnel fills in as customers use your codes." />
        )}
      </Card>

      <Card>
        <CardHeader title="Scans and reviews" subtitle="Per day across the period" />
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
          <CardHeader title="What customers mention" subtitle="Tags chosen with their feedback" />
          {tags.length ? (
            <RankedBars
              data={tags.slice(0, 8).map((tag) => ({
                label: tag.tag,
                value: tag.mentions,
                hint:
                  tag.avgRating === null
                    ? `${tag.mentions} mentions`
                    : `${tag.avgRating.toFixed(1)}★ · ${formatPercent(tag.positive / tag.mentions, 0)} positive`,
              }))}
              caption="Most mentioned tags"
            />
          ) : (
            <Empty title="No tags yet" detail="Customers pick these when they describe their visit." />
          )}
        </Card>

        <Card>
          <CardHeader title="Rating distribution" subtitle="How the ratings are spread" />
          {distribution.some((bucket) => bucket.count > 0) ? (
            <Donut
              data={distribution.map((row, index) => ({
                label: `${row.rating} star${row.rating > 1 ? 's' : ''}`,
                value: row.count,
                color: RANK_COLORS[index],
              }))}
              size={156}
              centerLabel="ratings"
              centerValue={formatNumber(distribution.reduce((sum, row) => sum + row.count, 0))}
            />
          ) : (
            <Empty title="No ratings in this period" detail="" />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Outlets" subtitle="Reviews collected per location" />
        {outlets.length ? (
          <RankedBars
            data={outlets.map((outlet) => ({
              label: outlet.name,
              value: outlet.reviews,
              hint:
                outlet.rating === null
                  ? `${formatNumber(outlet.scans)} scans · no feedback yet`
                  : `${outlet.rating.toFixed(1)}★ · ${formatNumber(outlet.scans)} scans`,
            }))}
            caption="Reviews by outlet"
          />
        ) : (
          <Empty title="No outlets yet" detail="" />
        )}
      </Card>
    </div>
  )
}
