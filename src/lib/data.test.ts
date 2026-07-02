import { describe, it, expect } from 'vitest'
import { getDataset, assistantAnswer } from './data'
import { BUSINESS_TYPES } from './business'

describe('business datasets', () => {
  it.each(BUSINESS_TYPES.map((b) => [b.id] as const))('%s dataset is well-formed', (type) => {
    const d = getDataset(type)

    expect(d.reviews.length).toBeGreaterThan(20)
    for (const r of d.reviews) {
      expect(r.rating).toBeGreaterThanOrEqual(1)
      expect(r.rating).toBeLessThanOrEqual(5)
      expect(['positive', 'neutral', 'negative']).toContain(r.sentiment)
      expect(['open', 'replied', 'closed']).toContain(r.status)
      expect(r.aiReply.length).toBeGreaterThan(20)
    }
    // newest first
    for (let i = 1; i < d.reviews.length; i++) {
      expect(d.reviews[i - 1].date.getTime()).toBeGreaterThanOrEqual(d.reviews[i].date.getTime())
    }
    // unique ids
    expect(new Set(d.reviews.map((r) => r.id)).size).toBe(d.reviews.length)

    expect(d.kpis).toHaveLength(4)
    expect(d.sentimentSplit.reduce((a, s) => a + s.value, 0)).toBe(100)
    expect(d.csat).toBeGreaterThan(0)
    expect(d.csat).toBeLessThanOrEqual(100)
    expect(d.topComplaints.length).toBeGreaterThan(0)
    expect(d.health.score).toBeGreaterThan(0)
    expect(d.actions).toHaveLength(3)
  })

  it('datasets are memoized and business-specific', () => {
    expect(getDataset('clinic')).toBe(getDataset('clinic'))
    const clinicBodies = getDataset('clinic').reviews.map((r) => r.body)
    const gymBodies = new Set(getDataset('gym').reviews.map((r) => r.body))
    expect(clinicBodies.some((b) => gymBodies.has(b))).toBe(false)
  })

  it('review services come from the business profile', () => {
    for (const b of BUSINESS_TYPES) {
      const d = getDataset(b.id)
      for (const r of d.reviews) expect(b.services).toContain(r.service)
    }
  })
})

describe('assistantAnswer', () => {
  const d = getDataset('restaurant')

  it('answers grounded in the active dataset', () => {
    expect(assistantAnswer('summarize this week', d)).toContain('restaurant')
    expect(assistantAnswer('what are the complaints?', d)).toContain(d.topComplaints[0].name)
    expect(assistantAnswer('explain my health score', d)).toContain(String(d.health.score))
  })

  it('adapts to a different business type', () => {
    const clinic = getDataset('clinic')
    expect(assistantAnswer('summarize this week', clinic)).toContain('clinic')
  })
})
