import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, MessageSquareWarning, Sparkles, Star, ThumbsUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { EntryRow } from '@/components/dashboard/EntryRow'
import { TrendChart } from '@/components/charts/TrendChart'
import { RankedBars } from '@/components/charts/BarChart'
import { Donut } from '@/components/charts/Donut'
import { NotFound } from '@/pages/NotFound'
import { isPositiveTag, outlets, productById } from '@/lib/data'
import { byOutlet, entriesIn, overview, ratingDistribution, ratingTrend, seriesFor, tagFrequency } from '@/lib/metrics'
import { negativeKeywords, positiveKeywords, productSummary } from '@/lib/insights'
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

export function ProductDetail() {
  const { productId = '' } = useParams()
  const product = productById(productId)
  const scope = useScope(productId)
  const data = useDataSet()

  const entries = useMemo(() => entriesIn(scope, data), [scope, data])
  const stats = useMemo(() => overview(scope, data), [scope, data])
  const series = useMemo(() => seriesFor(scope, data), [scope, data])
  const summary = useMemo(() => productSummary(productId, scope, data), [productId, scope, data])
  const trend = useMemo(() => ratingTrend(entries, 8), [entries])
  const outletRows = useMemo(() => byOutlet(scope, data), [scope, data])
  const distribution = useMemo(() => ratingDistribution(entries), [entries])
  const loved = useMemo(() => positiveKeywords(entries, 6), [entries])
  const issues = useMemo(() => negativeKeywords(entries, 6), [entries])
  const chips = useMemo(() => tagFrequency(entries, 10), [entries])

  if (!product) return <NotFound />

  const comments = entries.filter((entry) => entry.comment)

  return (
    <div className="space-y-6">
      <Link
        to="/app/products"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> All products
      </Link>

      <PageHeader
        title={`${product.emoji} ${product.name}`}
        description={`${product.category} · ${scope.range.label.toLowerCase()} · ${scope.outletId === 'all' ? 'all outlets' : outlets.find((o) => o.id === scope.outletId)?.name}`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCSV(
                entries.map((entry) => ({
                  date: entry.createdAt,
                  rating: entry.rating,
                  outlet: outlets.find((outlet) => outlet.id === entry.outletId)?.name ?? '',
                  tags: entry.tags.join(' | '),
                  comment: entry.comment,
                })),
                `reviewdot-${product.id}.csv`,
              )
            }
          >
            Export reviews
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Reviews"
          numeric={stats.reviews}
          format={formatNumber}
          trend={stats.trends.reviews}
          icon={MessageSquare}
          series={series.map((point) => point.reviews)}
        />
        <KpiCard
          label="Rating"
          numeric={stats.rating}
          format={(value) => `${value.toFixed(1)} ★`}
          trend={stats.trends.rating}
          icon={Star}
        />
        <KpiCard
          label="Positive feedback"
          numeric={stats.positiveShare}
          format={(value) => formatPercent(value, 0)}
          trend={stats.trends.positiveShare}
          icon={ThumbsUp}
        />
        <KpiCard
          label="Private feedback"
          numeric={stats.feedback}
          format={formatNumber}
          trend={stats.trends.feedback}
          icon={MessageSquareWarning}
          invertTrend
        />
      </div>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" /> AI customer summary
            </span>
          }
          subtitle="Generated from this product's own reviews — no numbers are invented."
          action={
            <Badge tone={summary.confidence === 'high' ? 'positive' : 'neutral'}>
              {summary.confidence} confidence
            </Badge>
          }
        />
        <p className="text-[15px] leading-relaxed text-ink-soft">{summary.headline}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">
              Customers frequently mention
            </p>
            <ul className="mt-3 space-y-2">
              {summary.loved.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[14px] text-ink-soft">
                  <span className="size-1.5 rounded-full bg-brand-400" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">
              Areas mentioned for improvement
            </p>
            <ul className="mt-3 space-y-2">
              {summary.improve.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[14px] text-ink-soft">
                  <span className="size-1.5 rounded-full bg-warn" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {summary.actions.length ? (
          <div className="mt-6 rounded-2xl bg-accent-soft p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Recommended actions</p>
            <ul className="mt-2.5 space-y-2">
              {summary.actions.map((action) => (
                <li key={action} className="text-[13px] leading-relaxed text-ink-soft">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Rating trend"
            subtitle={`Momentum: ${summary.momentum}`}
          />
          <TrendChart
            labels={trend.map((point) => point.label)}
            labelFormat={(label) => label}
            max={5}
            series={[
              {
                key: 'rating',
                label: 'Average rating',
                color: 'var(--color-chart-1)',
                values: trend.map((point) => point.value),
                fill: true,
              },
            ]}
            height={220}
            valueFormat={(value) => value.toFixed(1)}
            caption="Average rating per period"
          />
        </Card>

        <Card>
          <CardHeader title="Rating distribution" subtitle={`${entries.length} ratings`} />
          <Donut
            data={distribution.map((row, index) => ({
              label: `${row.rating}★`,
              value: row.count,
              color: RANK_COLORS[index],
            }))}
            size={150}
            centerLabel="average"
            centerValue={`${stats.rating.toFixed(1)}★`}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Positive keywords" subtitle="Phrases from happy customers" />
          {loved.length ? (
            <RankedBars data={loved.map((word) => ({ label: word.phrase, value: word.count }))} />
          ) : (
            <p className="text-[13px] text-muted">Not enough written feedback yet.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Negative keywords" subtitle="Phrases from critical feedback" />
          {issues.length ? (
            <RankedBars
              data={issues.map((word) => ({ label: word.phrase, value: word.count }))}
              color="var(--color-chart-3)"
            />
          ) : (
            <p className="text-[13px] text-muted">No critical comments in this period.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Feedback categories" subtitle="Chips customers selected" />
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Badge key={chip.tag} tone={isPositiveTag(chip.tag) ? 'positive' : 'warning'}>
                {chip.tag} · {chip.count}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Outlet performance"
          subtitle={`${product.name} across your outlets`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="py-2.5 font-medium">Outlet</th>
                <th className="py-2.5 text-right font-medium">Reviews</th>
                <th className="py-2.5 text-right font-medium">Rating</th>
                <th className="py-2.5 text-right font-medium">Share of its reviews</th>
              </tr>
            </thead>
            <tbody>
              {outletRows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="py-3 text-[14px] font-medium text-ink">{row.name}</td>
                  <td className="py-3 text-right text-[14px] tabular-nums text-ink-soft">{row.reviews}</td>
                  <td className="py-3 text-right text-[14px] tabular-nums text-ink">{row.rating.toFixed(1)}</td>
                  <td className="py-3 text-right text-[14px] tabular-nums text-muted">
                    {formatPercent(entries.length ? row.reviews / entries.length : 0, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Customer comments" subtitle={`${comments.length} written comments in this period`} />
        <div className="space-y-3">
          {comments.slice(0, 8).map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      </Card>
    </div>
  )
}
