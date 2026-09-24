import {
  byOutlet,
  byProduct,
  entriesIn,
  overview,
  ratingDistribution,
  seriesFor,
  type Scope,
} from '@/lib/metrics'
import { baseData } from '@/lib/metrics'
import {
  business,
  customers as demoCustomers,
  isPositiveTag,
  outletById,
  outlets as demoOutlets,
  products as demoProducts,
  productById,
  qrCodes as demoQRCodes,
} from '@/lib/data'
import type { DashboardScope } from './scope'
import {
  PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  type DashboardRepo,
  type FeedbackFilter,
  type FeedbackItem,
  type OutletRow,
  type CampaignRow,
  type CustomerRow,
  type Funnel,
  type OrganizationDetail,
  type PendingInvite,
  type OutletDetail,
  type OutletOption,
  type ProductRow,
  type OverviewStats,
  type Page,
  type RatingBucket,
  type ReviewItem,
  type ChannelRow,
  type WorkspaceCounts,
  type FeedbackStatusCounts,
  type SeriesPoint,
  type TagRow,
  type TeamMember,
} from './dashboard'

/**
 * The same dashboard, read from the seeded dataset.
 *
 * It delegates to lib/metrics rather than reimplementing anything, so demo mode
 * keeps reproducing the product's reference figures exactly — 1,248 scans, 326
 * reviews, 4.7★, 26.1% — which data.test.ts asserts. If a change moves those
 * numbers that is a bug in the change.
 *
 * Paging is done in memory here. That is fine against a fixed array and would
 * not be against a table, which is why the live implementation does not do it.
 */
export class DemoDashboardRepo implements DashboardRepo {
  private toMetricsScope(scope: DashboardScope): Scope {
    return { range: scope.range, outletId: scope.outletId ?? 'all' }
  }

  async outletOptions(): Promise<OutletOption[]> {
    return demoOutlets.map((outlet) => ({ id: outlet.id, name: outlet.name, city: outlet.city }))
  }

  async overview(scope: DashboardScope): Promise<OverviewStats> {
    const stats = overview(this.toMetricsScope(scope), baseData)
    return {
      scans: stats.scans,
      reviews: stats.reviews,
      rating: stats.reviews ? stats.rating : null,
      googleClicks: stats.googleClicks,
      positive: Math.round(stats.positiveShare * stats.reviews),
      negative: stats.reviews - Math.round(stats.positiveShare * stats.reviews),
      conversion: stats.scans ? stats.conversion : null,
      trends: {
        scans: stats.trends.scans,
        reviews: stats.trends.reviews,
        rating: stats.trends.rating,
        conversion: stats.trends.conversion,
      },
    }
  }

  async series(scope: DashboardScope): Promise<SeriesPoint[]> {
    return seriesFor(this.toMetricsScope(scope), baseData).map((point) => ({
      date: point.date,
      scans: point.scans,
      reviews: point.reviews,
    }))
  }

  async outlets(scope: DashboardScope): Promise<OutletRow[]> {
    return byOutlet(this.toMetricsScope(scope), baseData).map((row) => ({
      id: row.id,
      name: row.name,
      scans: row.scans,
      reviews: row.reviews,
      rating: row.reviews ? row.rating : null,
    }))
  }

  async ratingDistribution(scope: DashboardScope, productId?: string): Promise<RatingBucket[]> {
    const metricsScope = productId
      ? { ...this.toMetricsScope(scope), productId }
      : this.toMetricsScope(scope)
    return ratingDistribution(entriesIn(metricsScope, baseData))
  }

  async feedback(scope: DashboardScope, filter: FeedbackFilter = {}): Promise<Page<FeedbackItem>> {
    const limit = Math.min(Math.max(filter.limit ?? PAGE_SIZE, 1), 100)

    let entries = entriesIn(this.toMetricsScope(scope), baseData)
      .slice()
      .sort((a, b) => (a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt)))

    if (filter.maxRating) entries = entries.filter((entry) => entry.rating <= filter.maxRating!)
    if (filter.productId) entries = entries.filter((entry) => entry.productId === filter.productId)
    if (filter.status) entries = entries.filter((entry) => entry.status === filter.status)

    const cursor = decodeCursor(filter.cursor)
    if (cursor) {
      const index = entries.findIndex((entry) => entry.id === cursor.id)
      entries = index >= 0 ? entries.slice(index + 1) : entries
    }

    const page = entries.slice(0, limit)
    const last = page[page.length - 1]
    const hasMore = entries.length > limit

    return {
      items: page.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        rating: entry.rating,
        comment: entry.comment ?? null,
        tags: entry.tags,
        sentiment: entry.rating >= 4 ? 'positive' : entry.rating === 3 ? 'neutral' : 'negative',
        status: (entry.status ?? 'new') as FeedbackItem['status'],
        outletName: outletById(entry.outletId)?.name ?? null,
        productName: entry.productId ? (productById(entry.productId)?.name ?? null) : null,
      })),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    }
  }

  async outletsDetail(scope: DashboardScope): Promise<OutletDetail[]> {
    const totals = new Map((await this.outlets(scope)).map((row) => [row.id, row]))
    return demoOutlets.map((outlet) => {
      const row = totals.get(outlet.id)
      return {
        id: outlet.id,
        name: outlet.name,
        shortCode: outlet.name.slice(0, 2).toUpperCase(),
        city: outlet.city ?? null,
        address: null,
        googleReviewUrl: 'https://g.page/r/love-and-latte/review',
        status: 'active' as const,
        campaigns: demoQRCodes.filter((qr) => qr.outletId === outlet.id).length,
        scans: row?.scans ?? 0,
        reviews: row?.reviews ?? 0,
        rating: row?.rating ?? null,
      }
    })
  }

  async campaigns(scope: DashboardScope): Promise<CampaignRow[]> {
    return demoQRCodes
      .filter((qr) => !scope.outletId || qr.outletId === scope.outletId)
      .map((qr) => ({
        id: qr.id,
        name: qr.label,
        publicId: qr.code,
        referenceCode: qr.reference ?? qr.code.toUpperCase(),
        type: qr.type,
        placement: qr.location ?? null,
        status: qr.status === 'archived' ? ('archived' as const) : (qr.status as CampaignRow['status']),
        destination: qr.destination,
        outletId: qr.outletId,
        outletName: outletById(qr.outletId)?.name ?? null,
        productName: qr.productId ? (productById(qr.productId)?.name ?? null) : null,
        createdAt: qr.createdAt,
        scans: 0,
        reviews: 0,
        clicks: 0,
      }))
  }

  async tags(scope: DashboardScope, productId?: string): Promise<TagRow[]> {
    const metricsScope = productId
      ? { ...this.toMetricsScope(scope), productId }
      : this.toMetricsScope(scope)
    const entries = entriesIn(metricsScope, baseData)
    const counts = new Map<string, { mentions: number; positive: number; total: number }>()

    for (const entry of entries) {
      for (const tag of entry.tags) {
        const row = counts.get(tag) ?? { mentions: 0, positive: 0, total: 0 }
        row.mentions += 1
        if (isPositiveTag(tag)) row.positive += 1
        row.total += entry.rating
        counts.set(tag, row)
      }
    }

    return [...counts.entries()]
      .map(([tag, row]) => ({
        tag,
        mentions: row.mentions,
        positive: row.positive,
        avgRating: row.mentions ? row.total / row.mentions : null,
      }))
      .sort((a, b) => b.mentions - a.mentions || a.tag.localeCompare(b.tag))
  }

  async funnel(scope: DashboardScope): Promise<Funnel> {
    const stats = await this.overview(scope)
    // The seeded dataset has no sessions or drafts of its own, so those steps
    // are derived rather than invented: every piece of feedback came from a
    // session and produced a draft.
    return {
      scans: stats.scans,
      sessions: stats.scans,
      feedback: stats.reviews,
      drafts: stats.reviews,
      approved: stats.reviews,
      clicks: stats.googleClicks,
    }
  }

  async customers(scope: DashboardScope): Promise<CustomerRow[]> {
    // Seeded feedback carries a customerId rather than contact details, so the
    // grouping the live version does in SQL is a join here.
    const seen = new Set(
      entriesIn(this.toMetricsScope(scope), baseData)
        .map((entry) => entry.customerId)
        .filter((id): id is string => Boolean(id)),
    )

    return demoCustomers
      .filter((customer) => seen.has(customer.id))
      .map((customer) => ({
        contact: customer.contact,
        name: customer.name,
        visits: customer.visits,
        avgRating: customer.avgRating,
        lastSeen: customer.lastSeen,
      }))
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
      .slice(0, 100)
  }

  async reviews(scope: DashboardScope, filter: FeedbackFilter = {}): Promise<Page<ReviewItem>> {
    const page = await this.feedback(scope, filter)
    const items = page.items
      .map((item) => ({
        ...item,
        finalText: item.comment,
        editedByCustomer: false,
        destination: demoDestination(item.id),
        postedAt: item.createdAt,
      }))
      .filter((item) => !filter.destination || item.destination === filter.destination)

    return { items, nextCursor: page.nextCursor }
  }

  async products(scope: DashboardScope): Promise<ProductRow[]> {
    return byProduct(this.toMetricsScope(scope), baseData).map((row) => ({
      id: row.id,
      name: row.name,
      outletId: null,
      category: row.category,
      // the seeded catalogue prices in rupees; the schema stores minor units
      priceCents: Math.round(row.price * 100),
      reviews: row.reviews,
      rating: row.reviews ? row.rating : null,
      positive: Math.round(row.positive * row.reviews),
      privateFeedback: row.feedback,
      scans: row.scans,
      isActive: true,
    }))
  }

  async team(): Promise<TeamMember[]> {
    // The seeded workspace is one person. Inventing colleagues for a demo would
    // put names in a team list that belong to nobody.
    return [
      {
        id: 'demo-member',
        userId: 'demo-user',
        name: 'Ritika Shah',
        email: 'ritika@loveandlatte.in',
        role: 'OWNER',
        acceptedAt: new Date().toISOString(),
        assignedOutletIds: [],
      },
    ]
  }

  async organization(): Promise<OrganizationDetail | null> {
    return {
      id: business.id,
      name: business.name,
      slug: 'love-latte',
      shortCode: business.mark.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'LL',
      category: business.category,
      city: business.city,
      country: 'India',
      planCode: business.plan.toUpperCase(),
      planName: business.plan,
      subscriptionStatus: 'active',
    }
  }

  /**
   * Channels, on the seeded dataset.
   *
   * The split is derived from the seeded click-throughs rather than typed in,
   * so it moves with the reference figures instead of drifting away from them.
   * Instagram is left unconfigured on purpose: the demo should show both states
   * of the card, because a real workspace almost always has some channel it has
   * not set up yet.
   */
  async channels(scope: DashboardScope): Promise<ChannelRow[]> {
    const stats = overview(this.toMetricsScope(scope), baseData)
    const clicks = stats.googleClicks
    return [
      { channel: 'google', clicks: clicks - Math.round(clicks * 0.42), configured: true },
      { channel: 'zomato', clicks: Math.round(clicks * 0.27), configured: true },
      { channel: 'swiggy', clicks: Math.round(clicks * 0.15), configured: true },
      { channel: 'instagram', clicks: 0, configured: false },
    ]
  }

  async feedbackStatusCounts(scope: DashboardScope): Promise<FeedbackStatusCounts> {
    const entries = entriesIn(this.toMetricsScope(scope), baseData).filter(
      (entry) => entry.kind === 'feedback',
    )
    const of = (status: string) => entries.filter((entry) => entry.status === status).length
    return {
      // the seeded dataset uses 'in-progress' where the database says 'reviewed'
      new: of('new'),
      reviewed: of('in-progress'),
      responded: 0,
      resolved: of('resolved'),
      total: entries.length,
    }
  }

  /** Counted from the seeded dataset, the same way the live repo counts rows. */
  async counts(): Promise<WorkspaceCounts> {
    return {
      outlets: demoOutlets.length,
      campaigns: demoQRCodes.length,
      products: demoProducts.length,
      // one seeded account, and the team list says the same
      teamMembers: 1,
    }
  }

  async invites(): Promise<PendingInvite[]> {
    // Nothing is pending in a workspace nobody can be invited to.
    return []
  }
}

/**
 * Which platform a seeded review went to.
 *
 * The seeded dataset records no destination, so one is derived from the review's
 * own id: stable across reloads, and split in the same proportions the demo
 * channel cards report, so the tab counts and the list underneath agree. On a
 * real workspace this comes from review_events and is not derived at all.
 */
function demoDestination(id: string): string {
  let total = 0
  for (let i = 0; i < id.length; i += 1) total = (total * 31 + id.charCodeAt(i)) | 0
  const bucket = Math.abs(total) % 100
  if (bucket < 58) return 'google'
  if (bucket < 85) return 'zomato'
  return 'swiggy'
}
