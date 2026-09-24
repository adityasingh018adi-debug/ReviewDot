'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { RANGE_OPTIONS } from '@/lib/metrics'
import type { RangeKey } from '@/lib/metrics'
import { useApp } from '@/store/app'
import { useClickOutside } from '@/lib/hooks'
import { useSession } from './SessionProvider'
import { outlets } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

/**
 * The dashboard's scope, as controls.
 *
 * Lifted out of the topbar because the outlet filter belongs beside the page
 * title, while the date range stays in the chrome — but both write to the same
 * place, and having two copies of that logic is how they drift apart.
 */

/**
 * Moves the dashboard's scope into the URL.
 *
 * In live mode the server does the aggregation, so it has to be able to read
 * the filters before it renders — which means the query string, not the client
 * store. Demo mode still uses the store, because nothing server-side reads it.
 */
export function useScopeParam() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params?.toString() ?? '')
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      // paging restarts whenever the scope changes, or the cursor points into
      // a result set that no longer exists
      next.delete('cursor')
      const query = next.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [router, pathname, params],
  )
}

export function Popover({
  label,
  value,
  children,
  icon,
  className,
  align = 'left',
}: {
  label: string
  value: string
  children: (close: () => void) => React.ReactNode
  icon?: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))
  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:bg-raised"
      >
        {icon}
        <span className="max-w-[150px] truncate">{value}</span>
        <ChevronDown size={14} className="text-faint" />
      </button>
      {open ? (
        <div
          className={cn(
            'absolute top-12 z-50 min-w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-float',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

export const itemClass = (active: boolean) =>
  cn(
    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition-colors',
    active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-raised',
  )

export function OutletPicker({ className }: { className?: string }) {
  const session = useSession()
  const live = session.mode === 'live'
  const setParam = useScopeParam()
  const params = useSearchParams()

  const storeOutletId = useApp((s) => s.outletId)
  const setOutlet = useApp((s) => s.setOutlet)

  const options = live
    ? session.outlets
    : outlets.map((o) => ({ id: o.id, name: o.name, city: o.city }))
  const outletId = live ? (params?.get('outlet') ?? 'all') : storeOutletId
  const current = options.find((outlet) => outlet.id === outletId)

  const choose = (id: string | 'all') => {
    if (live) setParam({ outlet: id === 'all' ? null : id })
    else setOutlet(id)
  }

  return (
    <Popover
      label="Select outlet"
      value={current ? current.name : `All outlets (${options.length})`}
      className={className}
      align="right"
    >
      {(close) => (
        <>
          <button
            className={itemClass(outletId === 'all')}
            onClick={() => {
              choose('all')
              close()
            }}
          >
            All outlets
            <span className="text-[11px] text-faint">{options.length}</span>
          </button>
          {options.map((outlet) => (
            <button
              key={outlet.id}
              className={itemClass(outletId === outlet.id)}
              onClick={() => {
                choose(outlet.id)
                close()
              }}
            >
              {outlet.name}
              <span className="text-[11px] text-faint">{outlet.city}</span>
            </button>
          ))}
        </>
      )}
    </Popover>
  )
}

export function RangePicker() {
  const session = useSession()
  const live = session.mode === 'live'
  const setParam = useScopeParam()
  const params = useSearchParams()

  const storeRangeKey = useApp((s) => s.rangeKey)
  const storeCustom = useApp((s) => s.customRange)
  const setRange = useApp((s) => s.setRange)

  const rangeKey = live ? ((params?.get('range') as RangeKey | null) ?? '30d') : storeRangeKey
  const customRange = live
    ? { from: params?.get('from') ?? '', to: params?.get('to') ?? '' }
    : storeCustom

  const apply = (key: RangeKey, custom?: { from: string; to: string }) => {
    if (live) {
      setParam({
        range: key === '30d' ? null : key,
        from: custom?.from ?? null,
        to: custom?.to ?? null,
      })
    } else {
      setRange(key, custom)
    }
  }

  const [draft, setDraft] = useState(customRange)
  const label =
    rangeKey === 'custom' && customRange.from && customRange.to
      ? `${customRange.from} → ${customRange.to}`
      : (RANGE_OPTIONS.find((option) => option.key === rangeKey)?.label ?? '30 days')

  return (
    <Popover
      label="Select date range"
      value={label}
      icon={<Calendar size={15} className="text-faint" />}
      align="right"
    >
      {(close) => (
        <>
          {RANGE_OPTIONS.filter((option) => option.key !== 'custom').map((option) => (
            <button
              key={option.key}
              className={itemClass(rangeKey === option.key)}
              onClick={() => {
                apply(option.key as RangeKey)
                close()
              }}
            >
              {option.label}
            </button>
          ))}
          <div className="mt-1 border-t border-line p-2.5">
            <p className="mb-2 text-[12px] font-medium text-ink">Custom range</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="From date"
                className="h-9 px-2 text-[12px]"
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
              <Input
                type="date"
                aria-label="To date"
                className="h-9 px-2 text-[12px]"
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </div>
            <Button
              size="sm"
              className="mt-2 w-full"
              disabled={!draft.from || !draft.to}
              onClick={() => {
                apply('custom', draft)
                close()
              }}
            >
              Apply
            </Button>
          </div>
        </>
      )}
    </Popover>
  )
}
