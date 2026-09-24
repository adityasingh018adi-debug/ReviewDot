'use client'

import Link from 'next/link'
import { ArrowRight, Check, Clock, Filter, MessageSquareWarning } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Empty } from '@/components/ui/Empty'
import { cn, formatNumber, formatPercent } from '@/lib/utils'
import { FeedbackLine } from './DashboardLive'
import type { FeedbackItem, FeedbackStatusCounts, Page, TagRow } from '@/services/dashboard'
import { OutletPicker } from '@/components/layout/ScopePickers'

/**
 * Feedback, newest first, from the database.
 *
 * Paging runs through the URL rather than client state: the cursor is a link,
 * so a page of results is server-rendered, shareable and works without
 * JavaScript. It is keyset, so new feedback arriving between page one and page
 * two cannot push a row across the boundary and make it appear twice or not at
 * all — which is exactly what an offset would do on a table that only ever
 * grows at the front.
 */

const FILTERS = [
  { key: 'all', label: 'All', query: {} as Record<string, string> },
  { key: 'needs-attention', label: 'Needs attention', query: { max: '3' } },
  { key: 'new', label: 'New', query: { status: 'new' } },
] as const

export function FeedbackLive({
  rangeLabel,
  outletLabel,
  page,
  activeFilter,
  baseQuery,
  counts,
  themes,
}: {
  rangeLabel: string
  outletLabel: string
  page: Page<FeedbackItem>
  activeFilter: string
  /** Counted across the whole window, not just the rows on screen. */
  counts: FeedbackStatusCounts
  themes: TagRow[]
  /** The scope params to keep on every link out of this page. */
  baseQuery: Record<string, string>
}) {
  const linkFor = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ ...baseQuery, ...extra })
    const query = params.toString()
    return `/app/feedback${query ? `?${query}` : ''}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description={`${rangeLabel} · ${outletLabel}`}
        action={<OutletPicker />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatusTile label="New" value={counts.new} total={counts.total} icon={MessageSquareWarning} />
        <StatusTile label="In progress" value={counts.reviewed + counts.responded} total={counts.total} icon={Clock} />
        <StatusTile label="Resolved" value={counts.resolved} total={counts.total} icon={Check} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={linkFor(filter.query)}
            aria-current={activeFilter === filter.key ? 'page' : undefined}
            className={cn(
              'rounded-xl border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              activeFilter === filter.key
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-raised',
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader
          title="Everything customers told you"
          subtitle="Straight from the scan, in their own words"
          action={
            <span className="flex items-center gap-1.5 text-[12px] text-faint">
              <Filter size={13} /> {page.items.length} shown
            </span>
          }
        />

        {page.items.length ? (
          <div className="space-y-3">
            {page.items.map((item) => (
              <FeedbackLine key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty
            title="Nothing here"
            detail="No feedback matches this period and filter. Try a wider date range."
          />
        )}

        {page.nextCursor ? (
          <div className="mt-5 flex justify-center">
            <Link
              href={linkFor({
                ...(FILTERS.find((f) => f.key === activeFilter)?.query ?? {}),
                cursor: page.nextCursor,
              })}
              className="inline-flex h-11 items-center gap-1.5 rounded-2xl border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-raised"
            >
              Load more <ArrowRight size={15} />
            </Link>
          </div>
        ) : null}
      </Card>
      <ThemeList themes={themes} />
      </div>
    </div>
  )
}

/**
 * One triage bucket.
 *
 * The share beside it is of everything in the window, not of the page being
 * shown — counted in the database for exactly that reason, because a count of
 * the rows on screen stops being the truth the moment paging starts.
 */
function StatusTile({
  label,
  value,
  total,
  icon: Icon,
}: {
  label: string
  value: number
  total: number
  icon: typeof Check
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-raised text-muted">
        <Icon size={17} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[22px] font-bold leading-none tracking-tight text-ink">
          {formatNumber(value)}
        </p>
        <p className="mt-1 truncate text-[12px] text-muted">{label}</p>
      </div>
      {total ? (
        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
          {formatPercent(value / total, 0)}
        </span>
      ) : null}
    </div>
  )
}

/** What customers keep reporting, ranked. Straight from the tag aggregate. */
export function ThemeList({ themes }: { themes: TagRow[] }) {
  if (!themes.length) return null
  const top = themes.slice(0, 6)
  const max = Math.max(...top.map((theme) => theme.mentions), 1)

  return (
    <Card>
      <CardHeader title="What customers report" subtitle="Issue tags across this period" />
      <ul className="space-y-3">
        {top.map((theme) => (
          <li key={theme.tag}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] font-medium text-ink">{theme.tag}</span>
              <span className="shrink-0 text-[13px] tabular-nums text-ink-soft">
                {formatNumber(theme.mentions)}
              </span>
            </div>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-raised">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${Math.round((theme.mentions / max) * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
