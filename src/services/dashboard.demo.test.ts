import { describe, expect, it } from 'vitest'
import { DemoDashboardRepo } from './dashboard.demo'
import { scopeFromParams } from './scope'
import { PAGE_SIZE } from './dashboard'

/**
 * The demo path now runs through a repository rather than being read straight
 * out of the store, so this pins the thing that refactor could quietly break:
 * the product's reference figures. If these move, the change is wrong, not the
 * test — the same rule data.test.ts states.
 */
describe('DemoDashboardRepo', () => {
  const repo = new DemoDashboardRepo()
  const scope = scopeFromParams({ range: '30d' })

  it('still reports the reference figures over the 30-day window', async () => {
    const stats = await repo.overview(scope)
    expect(stats.scans).toBe(1248)
    expect(stats.reviews).toBe(326)
    expect(stats.rating).toBeCloseTo(4.7, 1)
    expect(stats.conversion).toBeCloseTo(0.261, 3)
  })

  it('returns a day per point across the window', async () => {
    const series = await repo.series(scope)
    expect(series.length).toBeGreaterThan(25)
    expect(series[0]).toHaveProperty('date')
    expect(series.every((point) => point.scans >= 0 && point.reviews >= 0)).toBe(true)
  })

  it('lists the outlets it can filter by', async () => {
    const options = await repo.outletOptions()
    expect(options.length).toBeGreaterThan(1)
    expect(options[0]).toHaveProperty('name')
  })

  it('narrows to one outlet', async () => {
    const options = await repo.outletOptions()
    const all = await repo.overview(scope)
    const one = await repo.overview({ ...scope, outletId: options[0]!.id })
    expect(one.reviews).toBeLessThan(all.reviews)
  })

  it('fills all five rating buckets', async () => {
    const buckets = await repo.ratingDistribution(scope)
    expect(buckets.map((b) => b.rating)).toEqual([5, 4, 3, 2, 1])
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(326)
  })

  it('pages feedback with a cursor rather than an offset', async () => {
    const first = await repo.feedback(scope)
    expect(first.items).toHaveLength(PAGE_SIZE)
    expect(first.nextCursor).toBeTruthy()

    const second = await repo.feedback(scope, { cursor: first.nextCursor })
    expect(second.items.length).toBeGreaterThan(0)

    // no row appears on both pages
    const firstIds = new Set(first.items.map((item) => item.id))
    expect(second.items.some((item) => firstIds.has(item.id))).toBe(false)
  })

  it('orders newest first', async () => {
    const page = await repo.feedback(scope)
    const dates = page.items.map((item) => item.createdAt)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('filters to the ratings that need attention', async () => {
    const page = await repo.feedback(scope, { maxRating: 3 })
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((item) => item.rating <= 3)).toBe(true)
  })

  it('reports an empty window honestly rather than as zero', async () => {
    const old = scopeFromParams({ range: 'custom', from: '2020-01-01', to: '2020-01-02' })
    const stats = await repo.overview(old)
    expect(stats.reviews).toBe(0)
    expect(stats.rating).toBeNull()
    expect(stats.conversion).toBeNull()
  })
})

describe('DemoDashboardRepo — outlets and campaigns', () => {
  const repo = new DemoDashboardRepo()
  const scope = scopeFromParams({ range: '30d' })

  it('describes each outlet with its numbers', async () => {
    const outlets = await repo.outletsDetail(scope)
    expect(outlets.length).toBeGreaterThan(1)
    for (const outlet of outlets) {
      expect(outlet.name).toBeTruthy()
      expect(outlet.shortCode).toMatch(/^[A-Z0-9]{2,6}$/)
      expect(outlet.campaigns).toBeGreaterThanOrEqual(0)
    }
  })

  it('lists campaigns with a scan code and a printed reference that differ', async () => {
    const campaigns = await repo.campaigns(scope)
    expect(campaigns.length).toBeGreaterThan(0)
    for (const campaign of campaigns) {
      expect(campaign.publicId).toBeTruthy()
      expect(campaign.referenceCode).not.toBe(campaign.publicId)
      expect(campaign.outletId).toBeTruthy()
    }
  })

  it('narrows campaigns to one outlet', async () => {
    const [first] = await repo.outletOptions()
    const all = await repo.campaigns(scope)
    const one = await repo.campaigns({ ...scope, outletId: first!.id })
    expect(one.length).toBeLessThanOrEqual(all.length)
    expect(one.every((campaign) => campaign.outletId === first!.id)).toBe(true)
  })
})
