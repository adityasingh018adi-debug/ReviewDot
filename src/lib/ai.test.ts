import { describe, expect, it } from 'vitest'
import { contextToPrompt, localAnswer, type AIContext } from './ai'

const context: AIContext = {
  business: 'Love & Latte',
  range: 'Last 30 days',
  outlet: 'All outlets',
  scans: 1248,
  reviews: 326,
  rating: 4.69,
  conversion: 0.2612,
  googleClicks: 168,
  topProducts: [
    { name: 'Mango Cheesecake', reviews: 86, rating: 4.9, positive: 0.91 },
    { name: 'Penne Arrabbiata', reviews: 6, rating: 4.2, positive: 0.67 },
  ],
  outlets: [
    { name: 'Thane', reviews: 150, rating: 4.7, conversion: 0.28 },
    { name: 'Bandra', reviews: 98, rating: 4.6, conversion: 0.24 },
  ],
  themes: [{ tag: 'Long Wait', count: 23 }],
  insights: [],
}

describe('localAnswer', () => {
  it('answers product questions with the leading product', () => {
    expect(localAnswer('which product is best?', context)).toContain('Mango Cheesecake')
  })

  it.each(['what should we improve?', 'what is hurting our rating?', 'what is dragging us down?'])(
    'answers problem questions with the weakest product and top issue: %s',
    (question) => {
      const answer = localAnswer(question, context)
      expect(answer).toContain('Penne Arrabbiata')
      expect(answer).toContain('Long Wait')
    },
  )

  it('answers conversion questions with the funnel numbers', () => {
    const answer = localAnswer('how is our scan conversion?', context)
    expect(answer).toContain('1248 scans')
    expect(answer).toContain('26.1%')
  })

  it('falls back gracefully when nothing matches', () => {
    expect(localAnswer('xyzzy', context)).toContain('Love & Latte')
  })
})

describe('contextToPrompt', () => {
  it('renders the workspace numbers as grounding text', () => {
    const prompt = contextToPrompt(context)
    expect(prompt).toContain('QR scans: 1248')
    expect(prompt).toContain('Mango Cheesecake: 86 reviews')
    expect(prompt).toContain('Long Wait: 23 mentions')
  })
})
