import { RANGE_OPTIONS, resolveRange, type DateRange, type RangeKey } from '@/lib/metrics'

/**
 * What the dashboard is currently looking at: a date window and an outlet.
 *
 * This used to live in the persisted client store, which was fine while every
 * figure was computed in the browser. Now the server does the aggregation, so
 * the scope has to be somewhere the server can read before it renders — which
 * means the query string. That also makes a filtered view shareable and
 * bookmarkable, which the store never was.
 */

export type DashboardScope = {
  range: DateRange
  rangeKey: RangeKey
  /** null means every outlet the viewer can see. */
  outletId: string | null
}

export type ScopeParams = {
  range?: string | string[]
  outlet?: string | string[]
  from?: string | string[]
  to?: string | string[]
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

const RANGE_KEYS = new Set(RANGE_OPTIONS.map((option) => option.key))

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Reads a scope out of search params. Everything is validated rather than
 * trusted: these values reach a SQL function, and an outlet id in particular
 * decides which rows are asked for. Row level security is what actually stops a
 * caller reading another tenant, but a malformed id should fail here as a
 * default rather than there as an error.
 */
export function scopeFromParams(params: ScopeParams): DashboardScope {
  const rawRange = single(params.range)
  const rangeKey: RangeKey = rawRange && RANGE_KEYS.has(rawRange as RangeKey) ? (rawRange as RangeKey) : '30d'

  const from = single(params.from)
  const to = single(params.to)
  const custom =
    rangeKey === 'custom' && from && to && ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to
      ? { from, to }
      : undefined

  // a custom range without a valid pair of dates falls back to the default
  const effectiveKey: RangeKey = rangeKey === 'custom' && !custom ? '30d' : rangeKey

  const outlet = single(params.outlet)
  const outletId = outlet && outlet !== 'all' && UUID.test(outlet) ? outlet : null

  return { range: resolveRange(effectiveKey, custom), rangeKey: effectiveKey, outletId }
}

/** The equally long window immediately before this one, for trend comparisons. */
export function previousWindow(range: DateRange): { from: Date; to: Date } {
  const to = new Date(range.from.getTime() - 1)
  const from = new Date(range.from.getTime() - range.days * 86_400_000)
  return { from, to }
}

/** Turns a scope back into a query string, for links that keep the filters. */
export function scopeToQuery(scope: Pick<DashboardScope, 'rangeKey' | 'outletId'>): string {
  const params = new URLSearchParams()
  if (scope.rangeKey !== '30d') params.set('range', scope.rangeKey)
  if (scope.outletId) params.set('outlet', scope.outletId)
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** Percentage change between two periods, as a signed fraction. */
export function trendBetween(current: number, previous: number): number {
  if (!previous) return current ? 1 : 0
  return (current - previous) / previous
}
