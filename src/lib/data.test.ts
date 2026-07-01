import { describe, it, expect } from 'vitest'
import { reviews, kpis, heatmapData, sentimentSplit, assistantAnswer } from './data'

describe('mock data invariants', () => {
  it('reviews are well-formed and newest-first', () => {
    expect(reviews.length).toBeGreaterThan(20)
    for (const r of reviews) {
      expect(r.rating).toBeGreaterThanOrEqual(1)
      expect(r.rating).toBeLessThanOrEqual(5)
      expect(r.aiReply.length).toBeGreaterThan(20)
      expect(['positive', 'neutral', 'negative']).toContain(r.sentiment)
    }
    for (let i = 1; i < reviews.length; i++) {
      expect(reviews[i - 1].date.getTime()).toBeGreaterThanOrEqual(reviews[i].date.getTime())
    }
  })

  it('review ids are unique', () => {
    expect(new Set(reviews.map((r) => r.id)).size).toBe(reviews.length)
  })

  it('kpis carry sparkline series', () => {
    expect(kpis).toHaveLength(4)
    for (const k of kpis) expect(k.spark.length).toBeGreaterThanOrEqual(8)
  })

  it('heatmap covers a full week of hours', () => {
    expect(heatmapData).toHaveLength(7)
    for (const day of heatmapData) expect(day).toHaveLength(24)
  })

  it('sentiment split sums to 100', () => {
    expect(sentimentSplit.reduce((a, s) => a + s.value, 0)).toBe(100)
  })
})

describe('assistantAnswer', () => {
  it('routes topic keywords to relevant answers', () => {
    expect(assistantAnswer('summarize negative reviews')).toContain('negative')
    expect(assistantAnswer('why did the app store drop')).toContain('App Store')
    expect(assistantAnswer('anything else')).toContain('94.2%')
  })
})
