import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor, fillRatingBuckets } from './dashboard'

describe('cursors', () => {
  it('round-trips the sort key', () => {
    const cursor = encodeCursor('2026-09-22T10:00:00.000Z', 'abc-123')
    expect(decodeCursor(cursor)).toEqual({ createdAt: '2026-09-22T10:00:00.000Z', id: 'abc-123' })
  })

  it('carries the id as well as the timestamp, so ties cannot drop a row', () => {
    const a = encodeCursor('2026-09-22T10:00:00.000Z', 'row-1')
    const b = encodeCursor('2026-09-22T10:00:00.000Z', 'row-2')
    expect(a).not.toBe(b)
  })

  it('refuses anything malformed rather than paging from a guess', () => {
    for (const bad of [null, undefined, '', 'not-base64!!', Buffer.from('nope').toString('base64url')]) {
      expect(decodeCursor(bad)).toBeNull()
    }
    expect(decodeCursor(Buffer.from('not-a-date|id').toString('base64url'))).toBeNull()
  })
})

describe('fillRatingBuckets', () => {
  it('returns five buckets, highest first, even from nothing', () => {
    const buckets = fillRatingBuckets([])
    expect(buckets.map((b) => b.rating)).toEqual([5, 4, 3, 2, 1])
    expect(buckets.every((b) => b.count === 0 && b.share === 0)).toBe(true)
  })

  it('computes each share of the total', () => {
    const buckets = fillRatingBuckets([
      { rating: 5, count: 3 },
      { rating: 4, count: 1 },
    ])
    expect(buckets[0]).toEqual({ rating: 5, count: 3, share: 0.75 })
    expect(buckets[1]).toEqual({ rating: 4, count: 1, share: 0.25 })
    expect(buckets[2]!.share).toBe(0)
  })
})
