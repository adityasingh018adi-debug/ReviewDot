import { describe, expect, it } from 'vitest'
import { businessInsights, feedbackThemes, negativeKeywords, positiveKeywords, productSummary } from './insights'
import { resolveRange } from './metrics'
import { entries, isPositiveTag } from './data'

const scope = { range: resolveRange('30d'), outletId: 'all' as const }

describe('keyword mining', () => {
  it('extracts phrases customers actually wrote', () => {
    const positive = positiveKeywords(entries, 6)
    expect(positive.length).toBeGreaterThan(0)
    expect(positive.every((k) => k.count > 1)).toBe(true)
    expect(positive.map((k) => k.phrase)).not.toContain('the')
  })

  it('separates praise from complaints', () => {
    const negative = negativeKeywords(entries, 6).map((k) => k.phrase)
    const positive = positiveKeywords(entries, 6).map((k) => k.phrase)
    expect(negative.some((phrase) => /wait|cold|sweet|soggy|shrunk|price/.test(phrase))).toBe(true)
    expect(positive.some((phrase) => /fresh|creamy|flavour|staff|presentation|portion/.test(phrase))).toBe(true)
  })
})

describe('productSummary', () => {
  const summary = productSummary('prd-mango-cheesecake', scope)

  it('summarises the product from its own reviews', () => {
    expect(summary.name).toBe('Mango Cheesecake')
    expect(summary.reviews).toBe(86)
    expect(summary.headline).toContain('Mango Cheesecake')
    expect(summary.confidence).toBe('high')
  })

  it('lists what customers loved and what to improve', () => {
    expect(summary.loved.length).toBeGreaterThan(0)
    expect(summary.improve.length).toBeGreaterThan(0)
    expect(summary.improve.every((item) => !isPositiveTag(item))).toBe(true)
    expect(summary.actions.length).toBeGreaterThan(0)
  })

  it('reports low confidence for thin products', () => {
    expect(productSummary('prd-chocolate-brownie', scope).confidence).toBe('low')
  })
})

describe('businessInsights', () => {
  const cards = businessInsights(scope)

  it('returns actionable cards grounded in the data', () => {
    expect(cards.length).toBeGreaterThanOrEqual(4)
    expect(cards.some((card) => card.kind === 'risk')).toBe(true)
    expect(cards.some((card) => card.kind === 'opportunity')).toBe(true)
    expect(cards.every((card) => card.metric && card.action)).toBe(true)
  })

  it('names the top product first', () => {
    expect(cards[0].title).toContain('Mango Cheesecake')
  })
})

describe('feedbackThemes', () => {
  it('clusters issues with outlet attribution', () => {
    const themes = feedbackThemes(scope)
    expect(themes.length).toBeGreaterThan(0)
    expect(themes[0].count).toBeGreaterThanOrEqual(themes[themes.length - 1].count)
    expect(themes[0].outlets.length).toBeGreaterThan(0)
    expect(themes.every((theme) => !isPositiveTag(theme.tag))).toBe(true)
  })
})

describe('keyword hygiene', () => {
  it('never returns the product, outlet or business name as a keyword', () => {
    const phrases = [...positiveKeywords(entries, 8), ...negativeKeywords(entries, 8)].map((k) => k.phrase)
    for (const banned of ['mango', 'cheesecake', 'tiramisu', 'thane', 'bandra', 'latte']) {
      expect(phrases.some((phrase) => phrase.includes(banned))).toBe(false)
    }
  })

  it('mines negative keywords only from critical ratings', () => {
    const phrases = negativeKeywords(entries, 8).map((k) => k.phrase)
    expect(phrases.length).toBeGreaterThan(0)
    expect(phrases.some((phrase) => /good|great|nice/.test(phrase))).toBe(false)
  })
})
