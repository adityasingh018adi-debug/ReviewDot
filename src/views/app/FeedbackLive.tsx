import Link from 'next/link'
import { ArrowRight, Filter } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Empty } from '@/components/ui/Empty'
import { cn } from '@/lib/utils'
import { FeedbackLine } from './DashboardLive'
import type { FeedbackItem, Page } from '@/services/dashboard'

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
}: {
  rangeLabel: string
  outletLabel: string
  page: Page<FeedbackItem>
  activeFilter: string
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
      <PageHeader title="Feedback" description={`${rangeLabel} · ${outletLabel}`} />

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

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={linkFor(filter.query)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                activeFilter === filter.key
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-raised',
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>

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
    </div>
  )
}
