import { serverClient } from './supabase.server'
import { previousWindow, trendBetween, type DashboardScope } from './scope'
import {
  PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  fillRatingBuckets,
  type DashboardRepo,
  type FeedbackFilter,
  type FeedbackItem,
  type OutletRow,
  type OutletOption,
  type OverviewStats,
  type Page,
  type RatingBucket,
  type SeriesPoint,
} from './dashboard'

/**
 * The dashboard, read from Postgres as the signed-in user.
 *
 * Everything here goes through serverClient(), which carries the caller's JWT,
 * so row level security decides what comes back. The organization id is passed
 * to the reporting functions but is not what authorizes the read — asking for
 * another organization returns zeroes, and reporting_test.sql pins that.
 *
 * Aggregation happens in the database. Nothing in this file fetches rows in
 * order to count them.
 */

type OverviewRow = {
  scans: number | string
  reviews: number | string
  rating: number | string | null
  google_clicks: number | string
  positive: number | string
  negative: number | string
}

/** Postgres returns bigint as a string over the wire; treat both shapes. */
const int = (value: number | string | null | undefined): number => {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const nullableFloat = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? n : null
}

const ratio = (top: number, bottom: number): number | null => (bottom > 0 ? top / bottom : null)

export class SupabaseDashboardRepo implements DashboardRepo {
  constructor(private readonly organizationId: string) {}

  private async callOverview(from: Date, to: Date, outletId: string | null): Promise<OverviewRow> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_overview', {
      p_org: this.organizationId,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
      p_outlet: outletId,
    })
    if (error) throw error
    // set-returning function: one row
    const row = (Array.isArray(data) ? data[0] : data) as OverviewRow | undefined
    return row ?? { scans: 0, reviews: 0, rating: null, google_clicks: 0, positive: 0, negative: 0 }
  }

  async outletOptions(): Promise<OutletOption[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase
      .from('outlets')
      .select('id, name, city')
      .neq('status', 'archived')
      .order('name')
    if (error) throw error
    return (data ?? []) as OutletOption[]
  }

  async overview(scope: DashboardScope): Promise<OverviewStats> {
    const previous = previousWindow(scope.range)

    // Both windows at once: the trend is half the figure, and waiting for them
    // in turn doubles the time to first paint for no reason.
    const [now, before] = await Promise.all([
      this.callOverview(scope.range.from, scope.range.to, scope.outletId),
      this.callOverview(previous.from, previous.to, scope.outletId),
    ])

    const scans = int(now.scans)
    const reviews = int(now.reviews)
    const rating = nullableFloat(now.rating)
    const conversion = ratio(reviews, scans)

    const prevScans = int(before.scans)
    const prevReviews = int(before.reviews)
    const prevRating = nullableFloat(before.rating)
    const prevConversion = ratio(prevReviews, prevScans)

    return {
      scans,
      reviews,
      rating,
      googleClicks: int(now.google_clicks),
      positive: int(now.positive),
      negative: int(now.negative),
      conversion,
      trends: {
        scans: trendBetween(scans, prevScans),
        reviews: trendBetween(reviews, prevReviews),
        rating: trendBetween(rating ?? 0, prevRating ?? 0),
        conversion: trendBetween(conversion ?? 0, prevConversion ?? 0),
      },
    }
  }

  async series(scope: DashboardScope): Promise<SeriesPoint[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_daily_series', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
      p_outlet: scope.outletId,
    })
    if (error) throw error

    return ((data ?? []) as { day: string; scans: number | string; reviews: number | string }[]).map(
      (row) => ({ date: row.day, scans: int(row.scans), reviews: int(row.reviews) }),
    )
  }

  async outlets(scope: DashboardScope): Promise<OutletRow[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_outlet_breakdown', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
    })
    if (error) throw error

    return (
      (data ?? []) as {
        outlet_id: string
        outlet_name: string
        scans: number | string
        reviews: number | string
        rating: number | string | null
      }[]
    ).map((row) => ({
      id: row.outlet_id,
      name: row.outlet_name,
      scans: int(row.scans),
      reviews: int(row.reviews),
      rating: nullableFloat(row.rating),
    }))
  }

  async ratingDistribution(scope: DashboardScope): Promise<RatingBucket[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_rating_distribution', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
      p_outlet: scope.outletId,
    })
    if (error) throw error

    return fillRatingBuckets(
      ((data ?? []) as { rating: number; count: number | string }[]).map((row) => ({
        rating: row.rating,
        count: int(row.count),
      })),
    )
  }

  async feedback(scope: DashboardScope, filter: FeedbackFilter = {}): Promise<Page<FeedbackItem>> {
    const supabase = await serverClient()
    const limit = Math.min(Math.max(filter.limit ?? PAGE_SIZE, 1), 100)

    let query = supabase
      .from('customer_feedback')
      .select('id, created_at, rating, comment, tags, sentiment, status, outlets (name), products (name)')
      .eq('organization_id', this.organizationId)
      .gte('created_at', scope.range.from.toISOString())
      .lte('created_at', scope.range.to.toISOString())
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      // one extra row tells us whether there is another page, without a count
      .limit(limit + 1)

    if (scope.outletId) query = query.eq('outlet_id', scope.outletId)
    if (filter.maxRating) query = query.lte('rating', filter.maxRating)
    if (filter.status) query = query.eq('status', filter.status)

    const cursor = decodeCursor(filter.cursor)
    if (cursor) {
      // Keyset: strictly older than the last row seen, with the id breaking
      // ties. An offset would repeat or skip rows as new feedback arrives.
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      )
    }

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as unknown as {
      id: string
      created_at: string
      rating: number
      comment: string | null
      tags: string[] | null
      sentiment: FeedbackItem['sentiment']
      status: FeedbackItem['status']
      outlets: { name: string } | null
      products: { name: string } | null
    }[]

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const last = page[page.length - 1]

    return {
      items: page.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        rating: row.rating,
        comment: row.comment,
        tags: row.tags ?? [],
        sentiment: row.sentiment,
        status: row.status,
        outletName: row.outlets?.name ?? null,
        productName: row.products?.name ?? null,
      })),
      nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
    }
  }
}
