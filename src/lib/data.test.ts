import { describe, expect, it } from 'vitest'
import {
  ISSUE_TAGS,
  POSITIVE_TAGS,
  SERVICE_TAGS,
  distributeInteger,
  entries,
  isPositiveTag,
  products,
  qrCodes,
  ratingSpread,
  scanEvents,
} from './data'
import { byOutlet, byProduct, overview, ratingDistribution, resolveRange, seriesFor } from './metrics'
import { average } from './utils'

const scope30 = { range: resolveRange('30d'), outletId: 'all' as const }

describe('ratingSpread', () => {
  it('hits each product target mean to one decimal', () => {
    for (const { target } of products) {
      const spread = ratingSpread(target.reviews, target.rating)
      expect(spread).toHaveLength(target.reviews)
      expect(Number(average(spread).toFixed(1))).toBe(target.rating)
      expect(Math.min(...spread)).toBeGreaterThanOrEqual(1)
      expect(Math.max(...spread)).toBeLessThanOrEqual(5)
    }
  })

  it('keeps 5★ as the largest bucket for a well-rated product', () => {
    const spread = ratingSpread(200, 4.6)
    const fives = spread.filter((r) => r === 5).length
    expect(fives).toBeGreaterThan(spread.filter((r) => r === 4).length)
    expect(new Set(spread).size).toBeGreaterThanOrEqual(4)
  })

  it('reaches low means without going below 1★', () => {
    const spread = ratingSpread(20, 2.5)
    expect(Number(average(spread).toFixed(1))).toBe(2.5)
    expect(Math.min(...spread)).toBeGreaterThanOrEqual(1)
  })
})

describe('distributeInteger', () => {
  it('always sums to the total', () => {
    expect(distributeInteger(922, [1, 2, 3, 4])).toHaveLength(4)
    expect(distributeInteger(922, [1, 2, 3, 4]).reduce((a, b) => a + b, 0)).toBe(922)
    expect(distributeInteger(7, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(7)
    expect(distributeInteger(0, [1, 2])).toEqual([0, 0])
  })
})

describe('30-day demo window', () => {
  const stats = overview(scope30)

  it('reproduces the headline dashboard figures', () => {
    expect(stats.scans).toBe(1248)
    expect(stats.reviews).toBe(326)
    expect(Number(stats.rating.toFixed(1))).toBe(4.7)
    expect(Number((stats.conversion * 100).toFixed(1))).toBe(26.1)
  })

  it('shows growth against the previous period', () => {
    expect(stats.trends.scans).toBeGreaterThan(0)
    expect(stats.trends.reviews).toBeGreaterThan(0)
    expect(stats.trends.rating).toBeGreaterThan(0)
  })

  it('reproduces the product intelligence table', () => {
    const table = byProduct(scope30)
    const expected = [
      ['Mango Cheesecake', 86, 4.9, 91],
      ['Tiramisu', 72, 4.8, 89],
      ['Caesar Salad', 54, 4.6, 84],
      ['Croissant', 43, 4.5, 81],
    ] as const
    expected.forEach(([name, reviews, rating, positive], index) => {
      const row = table[index]
      expect(row.name).toBe(name)
      expect(row.reviews).toBe(reviews)
      expect(Number(row.rating.toFixed(1))).toBe(rating)
      expect(Math.round(row.positive * 100)).toBe(positive)
    })
  })

  it('splits cleanly across outlets', () => {
    const rows = byOutlet(scope30)
    expect(rows).toHaveLength(3)
    expect(rows.reduce((total, row) => total + row.reviews, 0)).toBe(326)
    expect(rows.reduce((total, row) => total + row.scans, 0)).toBe(1248)
  })

  it('builds a daily series that matches the totals', () => {
    const series = seriesFor(scope30)
    expect(series).toHaveLength(30)
    expect(series.reduce((total, point) => total + point.scans, 0)).toBe(1248)
    expect(series.reduce((total, point) => total + point.reviews, 0)).toBe(326)
  })

  it('distributes ratings across all five buckets', () => {
    const distribution = ratingDistribution(entries)
    expect(distribution.map((d) => d.rating)).toEqual([5, 4, 3, 2, 1])
    expect(distribution.every((d) => d.count > 0)).toBe(true)
    expect(distribution.reduce((total, d) => total + d.share, 0)).toBeCloseTo(1, 5)
  })
})

describe('dataset integrity', () => {
  it('links every entry to a real QR code, outlet and product', () => {
    const qrIds = new Set(qrCodes.map((q) => q.id))
    expect(entries.every((entry) => qrIds.has(entry.qrId))).toBe(true)
    expect(entries.every((entry) => products.some((p) => p.id === entry.productId))).toBe(true)
  })

  it('pairs every converted scan with its entry', () => {
    const converted = scanEvents.filter((s) => s.converted)
    expect(converted).toHaveLength(entries.length)
    const entryIds = new Set(entries.map((e) => e.id))
    expect(converted.every((scan) => scan.entryId && entryIds.has(scan.entryId))).toBe(true)
  })

  it('classifies entries as public reviews or private feedback by rating', () => {
    expect(entries.filter((e) => e.kind === 'review').every((e) => e.rating >= 4)).toBe(true)
    expect(entries.filter((e) => e.kind === 'feedback').every((e) => e.rating <= 3)).toBe(true)
    expect(entries.filter((e) => e.kind === 'feedback' && e.publicClick)).toHaveLength(0)
  })

  it('keeps positive and issue vocabularies disjoint', () => {
    const positive = new Set<string>([...POSITIVE_TAGS, ...SERVICE_TAGS])
    expect(ISSUE_TAGS.some((tag) => positive.has(tag))).toBe(false)
    expect(ISSUE_TAGS.every((tag) => !isPositiveTag(tag))).toBe(true)
  })

  it('gives every piece of feedback at least one issue tag', () => {
    const complaints = entries.filter((e) => e.kind === 'feedback')
    expect(complaints.length).toBeGreaterThan(0)
    expect(complaints.every((e) => e.tags.some((tag) => !isPositiveTag(tag)))).toBe(true)
  })

  it('covers every QR type with active codes', () => {
    for (const type of ['outlet', 'table', 'product', 'packaging', 'bill', 'campaign']) {
      expect(qrCodes.some((q) => q.type === type && q.status === 'active')).toBe(true)
    }
  })
})
