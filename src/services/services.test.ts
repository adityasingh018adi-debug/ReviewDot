import { describe, expect, it } from 'vitest'
import { LocalBillingService } from './billing'
import { LocalAnalyticsService, CompositeAnalyticsService, ANALYTICS_EVENTS } from './analytics'
import { LocalReviewDestinationService, destinationsFrom } from './review-destination'
import { PLANS } from '@/lib/plans'
import type { AnalyticsService } from './types'

describe('LocalBillingService', () => {
  it('blocks creation once the plan limit is reached', async () => {
    const billing = new LocalBillingService(PLANS.FREE)
    expect((await billing.checkQuota('org', 'outlets')).allowed).toBe(true)
    await billing.recordUsage('org', 'outlets')
    expect((await billing.checkQuota('org', 'outlets')).allowed).toBe(false)
  })

  it('keeps usage separate per organization', async () => {
    const billing = new LocalBillingService(PLANS.FREE)
    await billing.recordUsage('org-a', 'outlets')
    expect((await billing.checkQuota('org-a', 'outlets')).allowed).toBe(false)
    expect((await billing.checkQuota('org-b', 'outlets')).allowed).toBe(true)
  })

  it('reports the active plan', async () => {
    const billing = new LocalBillingService(PLANS.GROWTH)
    const subscription = await billing.getSubscription('org')
    expect(subscription.plan.code).toBe('GROWTH')
    expect(subscription.status).toBe('active')
  })
})

describe('destinations', () => {
  it('builds the list from what the outlet configured', () => {
    const list = destinationsFrom({
      googleReviewUrl: 'https://g.page/x/review',
      reviewDestinations: [{ kind: 'tripadvisor', url: 'https://tripadvisor.com/x' }],
    })
    expect(list.map((d) => d.kind)).toEqual(['google', 'tripadvisor'])
    expect(list[1].label).toBe('Tripadvisor')
  })

  it('skips unconfigured and duplicate destinations', () => {
    expect(destinationsFrom({ googleReviewUrl: null, reviewDestinations: [] })).toEqual([])
    const list = destinationsFrom({
      googleReviewUrl: 'https://g.page/x/review',
      reviewDestinations: [{ kind: 'google', url: 'https://other' }],
    })
    expect(list).toHaveLength(1)
  })

  it('records a click-through without filtering by sentiment', async () => {
    const service = new LocalReviewDestinationService([
      { outletId: 'o1', destinations: [{ kind: 'google', label: 'Google', url: 'https://g' }] },
    ])
    expect(await service.listForOutlet('o1')).toHaveLength(1)
    await service.recordClick({ outletId: 'o1', campaignId: 'c1', kind: 'google' })
    expect(service.recorded).toEqual([{ outletId: 'o1', campaignId: 'c1', kind: 'google' }])
  })
})

describe('analytics', () => {
  it('records events', async () => {
    const analytics = new LocalAnalyticsService()
    await analytics.track({ name: ANALYTICS_EVENTS.scan, organizationId: 'org' })
    expect(analytics.recorded[0].name).toBe('qr.scanned')
  })

  it('keeps fanning out when one sink fails', async () => {
    const good = new LocalAnalyticsService()
    const bad: AnalyticsService = { track: async () => { throw new Error('down') } }
    const composite = new CompositeAnalyticsService([bad, good])
    await expect(composite.track({ name: 'test' })).resolves.toBeUndefined()
    expect(good.recorded).toHaveLength(1)
  })
})
