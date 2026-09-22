import { describe, expect, it } from 'vitest'
import { LocalAIReviewService, groundingIssues } from './ai-review'
import type { ReviewDraftInput } from './types'

const base: ReviewDraftInput = {
  comment: 'Coffee was really good and sandwich was fresh. Staff was friendly.',
  rating: 5,
  tags: ['Coffee', 'Service'],
  businessName: 'Love & Latte',
  outletName: 'Thane',
}

describe('groundingIssues', () => {
  it('passes a draft that only restates the customer', () => {
    expect(
      groundingIssues(base.comment, 'The coffee was really good and the sandwich was fresh.'),
    ).toEqual([])
  })

  it('catches an invented price', () => {
    const issues = groundingIssues(base.comment, 'Great value at ₹250 for the coffee.')
    expect(issues.some((issue) => issue.includes('price') || issue.includes('250'))).toBe(true)
  })

  it('catches an invented wait time', () => {
    expect(groundingIssues(base.comment, 'Served in under 5 minutes.').length).toBeGreaterThan(0)
  })

  it('catches an invented visit count', () => {
    expect(groundingIssues(base.comment, 'My third visit and still great.').length).toBeGreaterThan(0)
  })

  it('catches an invented star rating', () => {
    expect(groundingIssues(base.comment, 'Easily 5 stars from me.').length).toBeGreaterThan(0)
  })

  it('allows numbers the customer did mention', () => {
    expect(groundingIssues('Waited 20 minutes for the coffee.', 'We waited 20 minutes.')).toEqual([])
  })
})

describe('LocalAIReviewService', () => {
  const service = new LocalAIReviewService()

  it('builds a draft from the customer’s own words', async () => {
    const draft = await service.draftReview(base)
    expect(draft.offline).toBe(true)
    expect(draft.text).toContain('Coffee was really good')
    expect(draft.text).toContain('Love & Latte')
    expect(draft.ungrounded).toEqual([])
  })

  it('never invents content, whatever the input', async () => {
    const cases = [
      { ...base, comment: 'ok' },
      { ...base, comment: 'Too slow and the table was dirty.', rating: 2, tags: ['Cleanliness'] },
      { ...base, comment: 'Loved it!', productName: 'Cappuccino' },
    ]
    for (const input of cases) {
      const draft = await service.draftReview(input)
      expect(draft.ungrounded).toEqual([])
      expect(draft.text.length).toBeGreaterThan(0)
    }
  })

  it('does not add a positive opener to a critical rating', async () => {
    const draft = await service.draftReview({
      ...base,
      rating: 2,
      comment: 'Service was slow and coffee was cold.',
    })
    expect(draft.text).not.toContain('Had a good experience')
    expect(draft.text).toContain('Service was slow')
  })

  it('mentions the product only when the customer rated one', async () => {
    const withProduct = await service.draftReview({ ...base, productName: 'Tiramisu' })
    expect(withProduct.text).toContain('Tiramisu')
    const without = await service.draftReview(base)
    expect(without.text).not.toContain('Tiramisu')
  })
})
