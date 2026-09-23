import { describe, expect, it } from 'vitest'
import { insightsFrom, type InsightInput } from './insights'

const empty: InsightInput = {
  stats: {
    scans: 0,
    reviews: 0,
    rating: null,
    googleClicks: 0,
    positive: 0,
    negative: 0,
    conversion: null,
    trends: { scans: 0, reviews: 0, rating: 0, conversion: 0 },
  },
  outlets: [],
  tags: [],
  products: [],
}

const busy: InsightInput = {
  stats: {
    scans: 400,
    reviews: 100,
    rating: 4.4,
    googleClicks: 60,
    positive: 80,
    negative: 10,
    conversion: 0.25,
    trends: { scans: 0.1, reviews: 0.1, rating: 0, conversion: 0 },
  },
  outlets: [
    { id: 'a', name: 'Thane', scans: 200, reviews: 60, rating: 4.8 },
    { id: 'b', name: 'Bandra', scans: 200, reviews: 40, rating: 4.0 },
  ],
  tags: [
    { tag: 'Coffee', mentions: 40, positive: 38, avgRating: 4.8 },
    { tag: 'Waiting time', mentions: 20, positive: 2, avgRating: 3.1 },
  ],
  products: [{ id: 'p1', name: 'Mango Cheesecake', outletId: null, reviews: 30, rating: 4.9, positive: 27, isActive: true }],
}

describe('insightsFrom', () => {
  it('says nothing when there is nothing to say', () => {
    // a quiet week should produce fewer cards, not weaker ones
    expect(insightsFrom(empty)).toEqual([])
  })

  it('never invents a figure it was not given', () => {
    const cards = insightsFrom(busy)
    const text = cards.map((card) => `${card.title} ${card.detail} ${card.metric}`).join(' ')
    // every number in the output has to trace back to the input
    const numbers = text.match(/\d+(\.\d+)?/g) ?? []
    const allowed = new Set([
      '400', '100', '25', '60', '4.4', '4.8', '4.0', '0.8', '40', '20', '3.1', '30', '4.9', '1',
    ])
    for (const number of numbers) {
      expect(allowed.has(number), `unexplained number ${number} in "${text}"`).toBe(true)
    }
  })

  it('flags the tag that comes with the worst ratings', () => {
    const cards = insightsFrom(busy)
    const risk = cards.find((card) => card.kind === 'risk')
    expect(risk?.title).toContain('Waiting time')
    expect(risk?.metric).toContain('3.1')
  })

  it('spots a real gap between outlets, and ignores a small one', () => {
    expect(insightsFrom(busy).some((card) => card.id === 'outlet-gap')).toBe(true)

    const close = {
      ...busy,
      outlets: [
        { id: 'a', name: 'Thane', scans: 200, reviews: 60, rating: 4.5 },
        { id: 'b', name: 'Bandra', scans: 200, reviews: 40, rating: 4.4 },
      ],
    }
    expect(insightsFrom(close).some((card) => card.id === 'outlet-gap')).toBe(false)
  })

  it('will not draw a conclusion from a handful of rows', () => {
    const thin: InsightInput = {
      ...busy,
      tags: [{ tag: 'Waiting time', mentions: 2, positive: 0, avgRating: 1 }],
      outlets: [
        { id: 'a', name: 'Thane', scans: 4, reviews: 2, rating: 5 },
        { id: 'b', name: 'Bandra', scans: 4, reviews: 2, rating: 1 },
      ],
      products: [{ id: 'p1', name: 'Scone', outletId: null, reviews: 1, rating: 5, positive: 1, isActive: true }],
    }
    const cards = insightsFrom(thin)
    expect(cards.some((card) => card.kind === 'risk')).toBe(false)
    expect(cards.some((card) => card.id === 'outlet-gap')).toBe(false)
    expect(cards.some((card) => card.id.startsWith('product-'))).toBe(false)
  })

  it('describes low conversion as an opportunity and high as a trend', () => {
    const low = { ...busy, stats: { ...busy.stats, conversion: 0.05 } }
    expect(insightsFrom(low).find((c) => c.id === 'conversion')?.kind).toBe('opportunity')
    expect(insightsFrom(busy).find((c) => c.id === 'conversion')?.kind).toBe('trend')
  })

  it('does not treat keeping a review private as a failure', () => {
    const cards = insightsFrom({ ...busy, stats: { ...busy.stats, googleClicks: 10 } })
    const posting = cards.find((card) => card.id === 'posting')
    expect(posting?.detail).toContain('their choice')
  })
})
