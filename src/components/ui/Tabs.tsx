'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

/**
 * Filter tabs that live in the URL.
 *
 * The server renders these pages, so the selected tab has to be readable before
 * anything renders — which means the query string, not component state. It also
 * means a filtered view is a link somebody can send.
 *
 * A count of `null` renders no badge, which is the honest thing when the number
 * is not known without a second query.
 */
export type Tab = { key: string; label: string; count?: number | null }

export function Tabs({
  tabs,
  param,
  active,
  className,
}: {
  tabs: Tab[]
  /** Query-string key this control owns. */
  param: string
  /** The currently selected key — resolved by the server, not guessed here. */
  active: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const select = (key: string) => {
    const next = new URLSearchParams(params?.toString() ?? '')
    // the first tab is the default, so it stays out of the URL
    if (key === tabs[0]?.key) next.delete(param)
    else next.set(param, key)
    // paging restarts: the cursor points into a result set that no longer exists
    next.delete('cursor')
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div
      role="tablist"
      className={cn('flex flex-wrap items-center gap-1 rounded-2xl border border-line bg-surface p-1', className)}
    >
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={selected}
            onClick={() => select(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors',
              selected ? 'bg-accent text-on-accent' : 'text-muted hover:bg-raised hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count === null || tab.count === undefined ? null : (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] tabular-nums',
                  selected ? 'bg-white/20' : 'bg-raised text-faint',
                )}
              >
                {formatNumber(tab.count)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
