import { buildSeries, dayKey, entries, isPositiveTag, outlets, products, scanEvents } from './data'
import type { Entry, ScanPoint } from './types'
import type { ScanEvent } from './data'
import { average, trend } from './utils'

export type RangeKey = 'today' | '7d' | '30d' | '3m' | 'custom'

export type DateRange = {
  key: RangeKey
  label: string
  /** inclusive start day, exclusive end day, measured in days-ago */
  days: number
  from: Date
  to: Date
}

const DAY = 86_400_000

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '3m', label: '3 months', days: 90 },
  { key: 'custom', label: 'Custom', days: 30 },
]

export function resolveRange(key: RangeKey, custom?: { from: string; to: string }): DateRange {
  const today = startOfToday()
  if (key === 'custom' && custom?.from && custom?.to) {
    const from = new Date(custom.from)
    const to = new Date(custom.to)
    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY))
    return { key, label: 'Custom range', days, from, to }
  }
  const option = RANGE_OPTIONS.find((o) => o.key === key) ?? RANGE_OPTIONS[2]
  const from = new Date(today.getTime() - (option.days - 1) * DAY)
  const to = new Date(today.getTime() + DAY - 1)
  return { key: option.key, label: option.label, days: option.days, from, to }
}

/** The equally long window immediately before `range`, for trend comparisons. */
export function previousRange(range: DateRange): DateRange {
  const to = new Date(range.from.getTime() - 1)
  const from = new Date(range.from.getTime() - range.days * DAY)
  return { ...range, key: 'custom', label: 'Previous period', from, to }
}

export type Scope = {
  range: DateRange
  outletId: string | 'all'
  productId?: string
}

/**
 * Every metric reads from a data set rather than the static demo export, so
 * feedback captured live in the scan experience flows straight into the app.
 */
export type DataSet = {
  entries: Entry[]
  scans: ScanEvent[]
}

export const baseData: DataSet = { entries, scans: scanEvents }

const inRange = (iso: string, range: DateRange) => {
  const time = new Date(iso).getTime()
  return time >= range.from.getTime() && time <= range.to.getTime()
}

export function entriesIn(scope: Scope, data: DataSet = baseData): Entry[] {
  return data.entries.filter(
    (entry) =>
      inRange(entry.createdAt, scope.range) &&
      (scope.outletId === 'all' || entry.outletId === scope.outletId) &&
      (!scope.productId || entry.productId === scope.productId),
  )
}

export function scansIn(scope: Scope, data: DataSet = baseData): ScanEvent[] {
  return data.scans.filter(
    (event) =>
      inRange(event.createdAt, scope.range) &&
      (scope.outletId === 'all' || event.outletId === scope.outletId) &&
      (!scope.productId || event.productId === scope.productId),
  )
}

export type Overview = {
  scans: number
  reviews: number
  feedback: number
  rating: number
  conversion: number
  googleClicks: number
  /** Share of selected feedback chips that were positive. */
  positiveShare: number
  trends: {
    scans: number
    reviews: number
    rating: number
    conversion: number
    googleClicks: number
    feedback: number
    positiveShare: number
  }
}

function positiveShareOf(list: Entry[]): number {
  const tags = list.flatMap((entry) => entry.tags)
  return tags.length ? tags.filter(isPositiveTag).length / tags.length : 0
}

export function overview(scope: Scope, data: DataSet = baseData): Overview {
  const current = entriesIn(scope, data)
  const currentScans = scansIn(scope, data)
  const prevScope: Scope = { ...scope, range: previousRange(scope.range) }
  const previous = entriesIn(prevScope, data)
  const previousScans = scansIn(prevScope, data)

  const rating = average(current.map((e) => e.rating))
  const prevRating = average(previous.map((e) => e.rating))
  const conversion = currentScans.length ? current.length / currentScans.length : 0
  const prevConversion = previousScans.length ? previous.length / previousScans.length : 0
  const clicks = current.filter((e) => e.publicClick).length
  const prevClicks = previous.filter((e) => e.publicClick).length
  const feedbackCount = current.filter((e) => e.kind === 'feedback').length
  const prevFeedback = previous.filter((e) => e.kind === 'feedback').length
  const positive = positiveShareOf(current)
  const prevPositive = positiveShareOf(previous)

  return {
    scans: currentScans.length,
    reviews: current.length,
    feedback: feedbackCount,
    rating,
    conversion,
    googleClicks: clicks,
    positiveShare: positive,
    trends: {
      scans: trend(currentScans.length, previousScans.length),
      reviews: trend(current.length, previous.length),
      rating: trend(rating, prevRating),
      conversion: trend(conversion, prevConversion),
      googleClicks: trend(clicks, prevClicks),
      feedback: trend(feedbackCount, prevFeedback),
      positiveShare: trend(positive, prevPositive),
    },
  }
}

/** Daily scan + review series covering the scope's range. */
export function seriesFor(scope: Scope, data: DataSet = baseData): ScanPoint[] {
  const events = scansIn(scope, data)
  const series = buildSeries(events, Math.max(1, Math.min(180, scope.range.days)))
  // a custom range can start further back than the rolling window above
  if (scope.range.key !== 'custom') return series
  const byDay = new Map(series.map((point) => [point.date, point]))
  for (const event of events) {
    if (byDay.has(dayKey(event.createdAt))) continue
    const point: ScanPoint = { date: dayKey(event.createdAt), scans: 0, reviews: 0 }
    byDay.set(point.date, point)
  }
  for (const event of events) {
    const point = byDay.get(dayKey(event.createdAt))
    if (!point || series.some((s) => s.date === point.date)) continue
    point.scans += 1
    if (event.converted) point.reviews += 1
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function ratingDistribution(list: Entry[]): { rating: number; count: number; share: number }[] {
  const counts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: list.filter((entry) => entry.rating === rating).length,
    share: 0,
  }))
  const total = list.length || 1
  return counts.map((row) => ({ ...row, share: row.count / total }))
}

export type OutletStat = {
  id: string
  name: string
  city: string
  scans: number
  reviews: number
  rating: number
  conversion: number
  feedback: number
}

export function byOutlet(scope: Scope, data: DataSet = baseData): OutletStat[] {
  return outlets
    .map((outlet) => {
      const own = entriesIn({ ...scope, outletId: outlet.id }, data)
      const scans = scansIn({ ...scope, outletId: outlet.id }, data).length
      return {
        id: outlet.id,
        name: outlet.name,
        city: outlet.city,
        scans,
        reviews: own.length,
        rating: average(own.map((e) => e.rating)),
        conversion: scans ? own.length / scans : 0,
        feedback: own.filter((e) => e.kind === 'feedback').length,
      }
    })
    .sort((a, b) => b.reviews - a.reviews)
}

export type ProductStat = {
  id: string
  name: string
  category: string
  emoji: string
  price: number
  reviews: number
  rating: number
  positive: number
  feedback: number
  scans: number
}

export function byProduct(scope: Scope, data: DataSet = baseData): ProductStat[] {
  return products
    .map((product) => {
      const own = entriesIn({ ...scope, productId: product.id }, data)
      const tags = own.flatMap((entry) => entry.tags)
      const positiveTags = tags.filter(isPositiveTag).length
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        emoji: product.emoji,
        price: product.price,
        reviews: own.length,
        rating: average(own.map((e) => e.rating)),
        positive: tags.length ? positiveTags / tags.length : 0,
        feedback: own.filter((e) => e.kind === 'feedback').length,
        scans: scansIn({ ...scope, productId: product.id }, data).length,
      }
    })
    .filter((stat) => stat.reviews > 0)
    .sort((a, b) => b.reviews - a.reviews)
}

/** Rolling weekly rating, used for the product rating trend line. */
export function ratingTrend(list: Entry[], buckets = 8): { label: string; value: number }[] {
  if (!list.length) return []
  const sorted = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const first = new Date(sorted[0].createdAt).getTime()
  const last = new Date(sorted[sorted.length - 1].createdAt).getTime()
  const span = Math.max(DAY, last - first)
  const slots: Entry[][] = Array.from({ length: buckets }, () => [])
  for (const entry of sorted) {
    const position = (new Date(entry.createdAt).getTime() - first) / span
    slots[Math.min(buckets - 1, Math.floor(position * buckets))].push(entry)
  }
  return slots.map((slot, index) => ({
    label: `W${index + 1}`,
    value: slot.length ? average(slot.map((e) => e.rating)) : 0,
  }))
}

export function tagFrequency(list: Entry[], limit = 8): { tag: string; count: number; share: number }[] {
  const counts = new Map<string, number>()
  for (const entry of list) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, share: count / total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
