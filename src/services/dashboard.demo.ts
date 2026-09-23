import { byOutlet, entriesIn, overview, ratingDistribution, seriesFor, type Scope } from '@/lib/metrics'
import { baseData } from '@/lib/metrics'
import {
  customers as demoCustomers,
  isPositiveTag,
  outletById,
  outlets as demoOutlets,
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
  type OutletDetail,
  type OutletOption,
  type OverviewStats,
  type Page,
  type RatingBucket,
  type ReviewItem,
  type SeriesPoint,
  type TagRow,
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

  async ratingDistribution(scope: DashboardScope): Promise<RatingBucket[]> {
    return ratingDistribution(entriesIn(this.toMetricsScope(scope), baseData))
  }

  async feedback(scope: DashboardScope, filter: FeedbackFilter = {}): Promise<Page<FeedbackItem>> {
    const limit = Math.min(Math.max(filter.limit ?? PAGE_SIZE, 1), 100)

    let entries = entriesIn(this.toMetricsScope(scope), baseData)
      .slice()
      .sort((a, b) => (a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt)))

    if (filter.maxRating) entries = entries.filter((entry) => entry.rating <= filter.maxRating!)
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

  async tags(scope: DashboardScope): Promise<TagRow[]> {
    const entries = entriesIn(this.toMetricsScope(scope), baseData)
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
    return {
      items: page.items.map((item) => ({
        ...item,
        finalText: item.comment,
        editedByCustomer: false,
        destination: 'google',
        postedAt: item.createdAt,
      })),
      nextCursor: page.nextCursor,
    }
  }
}
