import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  MessageSquare,
  Package,
  Plus,
  QrCode,
  ScanLine,
  Smile,
  Star,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatTile } from '@/components/dashboard/StatTile'
import { ChannelCard } from '@/components/dashboard/ChannelCard'
import { OutletPicker } from '@/components/layout/ScopePickers'
import { TrendChart } from '@/components/charts/TrendChart'
import { Empty } from '@/components/ui/Empty'
import { Stars } from '@/components/ui/Stars'
import { formatNumber, formatPercent, formatRating, relativeTime } from '@/lib/utils'
import type { InsightCard } from '@/lib/insights'
import type {
  ChannelRow,
  FeedbackItem,
  OutletRow,
  OverviewStats,
  ProductRow,
  SeriesPoint,
  WorkspaceCounts,
} from '@/services/dashboard'

/**
 * The Overview.
 *
 * Every figure on this page came out of the database for the workspace being
 * looked at. Nothing is illustrative, and where there is nothing to show the
 * panel says so rather than borrowing a number from somewhere else — a
 * dashboard that invents a business's own statistics is worse than an empty
 * one, because the empty one can be trusted.
 */
export function DashboardLive({
  greetingName,
  organizationName,
  rangeLabel,
  stats,
  series,
  outlets,
  channels,
  products,
  counts,
  insights,
  recent,
}: {
  greetingName: string
  organizationName: string
  rangeLabel: string
  stats: OverviewStats
  series: SeriesPoint[]
  outlets: OutletRow[]
  channels: ChannelRow[]
  products: ProductRow[]
  counts: WorkspaceCounts
  insights: InsightCard[]
  recent: FeedbackItem[]
}) {
  const nothingYet = stats.scans === 0 && stats.reviews === 0
  const rated = stats.positive + stats.negative
  const positiveShare = rated ? stats.positive / rated : null

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">
            {greeting()}, {greetingName}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            What your customers are saying · {organizationName} · {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OutletPicker />
          <Link
            href="/app/campaigns"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-[13px] font-medium text-on-accent shadow-soft transition-opacity hover:opacity-90"
          >
            <Plus size={15} strokeWidth={2.4} /> Create QR code
          </Link>
        </div>
      </header>

      {nothingYet ? (
        <Card>
          <Empty
            title="No scans yet"
            detail="Once a customer scans one of your codes, everything on this page fills in. Nothing here is illustrative — it is all your own data."
            action={
              <Link
                href="/app/campaigns"
                className="text-[13px] font-medium text-accent hover:underline"
              >
                Create your first QR code →
              </Link>
            }
          />
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Total scans"
          value={formatNumber(stats.scans)}
          icon={ScanLine}
          tone="brand"
          trend={stats.trends.scans}
          series={series.map((point) => point.scans)}
        />
        <StatTile
          label="Reviews generated"
          value={formatNumber(stats.reviews)}
          icon={MessageSquare}
          tone="blue"
          trend={stats.trends.reviews}
          series={series.map((point) => point.reviews)}
        />
        <StatTile
          label="Average rating"
          value={stats.rating === null ? '—' : formatRating(stats.rating)}
          icon={Star}
          tone="amber"
          trend={stats.rating === null ? null : stats.trends.rating}
        />
        <StatTile
          label="Positive feedback"
          value={positiveShare === null ? '—' : formatPercent(positiveShare, 0)}
          icon={Smile}
          tone="green"
          trend={null}
        />
        <StatTile
          label="Active QR codes"
          value={formatNumber(counts.campaigns)}
          icon={QrCode}
          tone="brand"
          trend={null}
        />
      </div>

      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">Review channels</h2>
          <p className="text-[12.5px] text-muted">Where you send customers after they rate you.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {channels.map((channel) => (
            <ChannelCard key={channel.channel} row={channel} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Scans and reviews" subtitle={rangeLabel} />
          <TrendChart
            labels={series.map((point) => point.date)}
            series={[
              {
                key: 'scans',
                label: 'Scans',
                color: 'var(--color-chart-2)',
                values: series.map((point) => point.scans),
              },
              {
                key: 'reviews',
                label: 'Reviews',
                color: 'var(--color-chart-1)',
                values: series.map((point) => point.reviews),
                fill: true,
              },
            ]}
            height={240}
          />
        </Card>

        <Card>
          <CardHeader
            title="Outlet performance"
            action={
              <Link href="/app/outlets" className="text-[12px] font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {outlets.length ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-faint">
                  <th className="pb-2 text-left font-semibold">Outlet</th>
                  <th className="pb-2 text-right font-semibold">Scans</th>
                  <th className="pb-2 text-right font-semibold">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {outlets.slice(0, 5).map((outlet, index) => (
                  <tr key={outlet.id} className="border-t border-line">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-raised text-[10px] font-bold text-muted">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">{outlet.name}</span>
                          {outlet.rating === null ? null : (
                            <span className="text-[11px] text-faint">
                              {formatRating(outlet.rating)} ★
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {formatNumber(outlet.scans)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {formatNumber(outlet.reviews)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-muted">No outlets in this range.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent feedback"
            action={
              <Link href="/app/inbox" className="text-[12px] font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Stars value={item.rating} size={13} />
                    {item.comment ? (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                        “{item.comment}”
                      </p>
                    ) : (
                      <p className="mt-1 text-[13px] italic text-faint">Rating only, no comment.</p>
                    )}
                    <p className="mt-1 truncate text-[11.5px] text-faint">
                      {[item.productName, item.outletName].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-faint">
                    {relativeTime(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">No feedback in this range.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="AI insights"
            subtitle="Computed from your data, not written by a model"
            action={
              <Link href="/app/insights" className="text-[12px] font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {insights.length ? (
            <ul className="space-y-2.5">
              {insights.slice(0, 3).map((card) => (
                <li key={card.id} className="rounded-2xl border border-line bg-raised p-3.5">
                  <p className="text-[13px] font-semibold text-ink">{card.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{card.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              Not enough feedback yet for a finding worth stating. Cards appear once there is enough
              behind them to mean something.
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Top products by reviews"
            action={
              <Link href="/app/products" className="text-[12px] font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {products.length ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-faint">
                  <th className="pb-2 text-left font-semibold">Product</th>
                  <th className="pb-2 text-right font-semibold">Rating</th>
                  <th className="pb-2 text-right font-semibold">Reviews</th>
                  <th className="pb-2 pl-4 text-right font-semibold">Positive</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => {
                  // `positive` is a count of positive reviews, not a share —
                  // formatting it directly is how this column once read 7800%.
                  const share = product.reviews ? product.positive / product.reviews : 0
                  return (
                  <tr key={product.id} className="border-t border-line">
                    <td className="py-2.5">
                      <Link
                        href={`/app/products/${product.id}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {product.rating === null ? '—' : formatRating(product.rating)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {formatNumber(product.reviews)}
                    </td>
                    <td className="py-2.5 pl-4 text-right">
                      <span className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-raised">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{ width: `${Math.round(share * 100)}%` }}
                          />
                        </span>
                        <span className="w-9 tabular-nums text-[12px] text-ink-soft">
                          {formatPercent(share, 0)}
                        </span>
                      </span>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-muted">No product feedback in this range.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-2.5">
            <QuickAction href="/app/campaigns" icon={QrCode} label="Create QR code" hint="Generate a new one" />
            <QuickAction href="/app/outlets" icon={Building2} label="Add outlet" hint="Manage locations" />
            <QuickAction href="/app/products" icon={Package} label="Add product" hint="Track by item" />
            <QuickAction href="/app/insights" icon={ArrowRight} label="See insights" hint="What to fix first" />
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
            {formatNumber(counts.outlets)} outlets · {formatNumber(counts.products)} products ·{' '}
            {formatNumber(counts.teamMembers)} team members
          </p>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string
  icon: typeof QrCode
  label: string
  hint: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-raised p-3 transition-colors hover:border-accent hover:bg-accent-soft"
    >
      <Icon size={16} className="text-accent" strokeWidth={2.1} />
      <p className="mt-2 text-[12.5px] font-semibold leading-tight text-ink">{label}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-faint">{hint}</p>
    </Link>
  )
}

/** Local to the reader, which is the only place a greeting means anything. */
function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * One piece of feedback, as a row. Shared with the feedback and product pages,
 * which is why it lives here rather than inside this file's own markup.
 */
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
