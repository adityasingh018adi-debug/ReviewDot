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
  type SeriesPoint,
  type ChannelRow,
  type ChannelKey,
  type WorkspaceCounts,
  type FeedbackStatusCounts,
  CHANNELS,
  type TagRow,
  type TeamMember,
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
    if (filter.productId) query = query.eq('product_id', filter.productId)

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

  async outletsDetail(scope: DashboardScope): Promise<OutletDetail[]> {
    const supabase = await serverClient()

    // The rows and their numbers separately: the counts are an aggregate the
    // database computes, and merging two small result sets here beats a
    // correlated subquery per column in a view.
    const [rows, totals] = await Promise.all([
      supabase
        .from('outlets')
        .select('id, name, short_code, city, address, google_review_url, status, qr_campaigns(count)')
        .neq('status', 'archived')
        .order('name'),
      this.outletTotals(scope),
    ])

    if (rows.error) throw rows.error

    return (
      (rows.data ?? []) as unknown as {
        id: string
        name: string
        short_code: string
        city: string | null
        address: string | null
        google_review_url: string | null
        status: OutletDetail['status']
        qr_campaigns: { count: number }[]
      }[]
    ).map((row) => {
      const totalsFor = totals.get(row.id)
      return {
        id: row.id,
        name: row.name,
        shortCode: row.short_code,
        city: row.city,
        address: row.address,
        googleReviewUrl: row.google_review_url,
        status: row.status,
        campaigns: row.qr_campaigns?.[0]?.count ?? 0,
        scans: totalsFor?.scans ?? 0,
        reviews: totalsFor?.reviews ?? 0,
        rating: totalsFor?.rating ?? null,
      }
    })
  }

  private async outletTotals(scope: DashboardScope) {
    const breakdown = await this.outlets(scope)
    return new Map(breakdown.map((row) => [row.id, row]))
  }

  async campaigns(scope: DashboardScope): Promise<CampaignRow[]> {
    const supabase = await serverClient()

    let query = supabase
      .from('qr_campaigns')
      .select(
        'id, name, public_id, reference_code, type, placement, status, destination, outlet_id, created_at, outlets (name), products (name)',
      )
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (scope.outletId) query = query.eq('outlet_id', scope.outletId)

    const [rows, counts] = await Promise.all([
      query,
      supabase.rpc('app_campaign_breakdown', {
        p_org: this.organizationId,
        p_from: scope.range.from.toISOString(),
        p_to: scope.range.to.toISOString(),
        p_outlet: scope.outletId,
      }),
    ])

    if (rows.error) throw rows.error
    if (counts.error) throw counts.error

    const byCampaign = new Map(
      ((counts.data ?? []) as { campaign_id: string; scans: number | string; reviews: number | string; clicks: number | string }[]).map(
        (row) => [row.campaign_id, row],
      ),
    )

    return (
      (rows.data ?? []) as unknown as {
        id: string
        name: string
        public_id: string
        reference_code: string
        type: string
        placement: string | null
        status: CampaignRow['status']
        destination: string
        outlet_id: string
        created_at: string
        outlets: { name: string } | null
        products: { name: string } | null
      }[]
    ).map((row) => {
      const stats = byCampaign.get(row.id)
      return {
        id: row.id,
        name: row.name,
        publicId: row.public_id,
        referenceCode: row.reference_code,
        type: row.type,
        placement: row.placement,
        status: row.status,
        destination: row.destination,
        outletId: row.outlet_id,
        outletName: row.outlets?.name ?? null,
        productName: row.products?.name ?? null,
        createdAt: row.created_at,
        scans: int(stats?.scans),
        reviews: int(stats?.reviews),
        clicks: int(stats?.clicks),
      }
    })
  }

  async tags(scope: DashboardScope): Promise<TagRow[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_tag_breakdown', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
      p_outlet: scope.outletId,
    })
    if (error) throw error

    return (
      (data ?? []) as {
        tag: string
        mentions: number | string
        positive: number | string
        avg_rating: number | string | null
      }[]
    ).map((row) => ({
      tag: row.tag,
      mentions: int(row.mentions),
      positive: int(row.positive),
      avgRating: nullableFloat(row.avg_rating),
    }))
  }

  async funnel(scope: DashboardScope): Promise<Funnel> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_funnel', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
      p_outlet: scope.outletId,
    })
    if (error) throw error

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, number | string> | undefined
    return {
      scans: int(row?.scans),
      sessions: int(row?.sessions),
      feedback: int(row?.feedback),
      drafts: int(row?.drafts),
      approved: int(row?.approved),
      clicks: int(row?.clicks),
    }
  }

  async customers(scope: DashboardScope): Promise<CustomerRow[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_customers', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
      p_outlet: scope.outletId,
    })
    if (error) throw error

    return (
      (data ?? []) as {
        contact: string
        name: string | null
        visits: number | string
        avg_rating: number | string | null
        last_seen: string
      }[]
    ).map((row) => ({
      contact: row.contact,
      name: row.name,
      visits: int(row.visits),
      avgRating: nullableFloat(row.avg_rating),
      lastSeen: row.last_seen,
    }))
  }

  async reviews(scope: DashboardScope, filter: FeedbackFilter = {}): Promise<Page<ReviewItem>> {
    const supabase = await serverClient()
    const limit = Math.min(Math.max(filter.limit ?? PAGE_SIZE, 1), 100)

    // !inner on review_events is the definition of "became a public review":
    // the customer chose a destination and clicked through. Feedback that never
    // reached one belongs on the feedback page, not in this inbox.
    let query = supabase
      .from('customer_feedback')
      .select(
        `id, created_at, rating, comment, tags, sentiment, status,
         outlets (name), products (name),
         ai_review_drafts (final_text, draft_text, edited_by_customer, approved_at),
         review_events!inner (destination, clicked_at)`,
      )
      .eq('organization_id', this.organizationId)
      .gte('created_at', scope.range.from.toISOString())
      .lte('created_at', scope.range.to.toISOString())
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1)

    if (scope.outletId) query = query.eq('outlet_id', scope.outletId)

    const cursor = decodeCursor(filter.cursor)
    if (cursor) {
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
      sentiment: ReviewItem['sentiment']
      status: ReviewItem['status']
      outlets: { name: string } | null
      products: { name: string } | null
      ai_review_drafts: {
        final_text: string | null
        draft_text: string
        edited_by_customer: boolean
        approved_at: string | null
      }[]
      review_events: { destination: string; clicked_at: string }[]
    }[]

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const last = page[page.length - 1]

    return {
      items: page.map((row) => {
        const draft = row.ai_review_drafts?.[0]
        const event = row.review_events?.[0]
        return {
          id: row.id,
          createdAt: row.created_at,
          rating: row.rating,
          comment: row.comment,
          tags: row.tags ?? [],
          sentiment: row.sentiment,
          status: row.status,
          outletName: row.outlets?.name ?? null,
          productName: row.products?.name ?? null,
          finalText: draft?.final_text ?? draft?.draft_text ?? null,
          editedByCustomer: Boolean(draft?.edited_by_customer),
          destination: event?.destination ?? null,
          postedAt: event?.clicked_at ?? null,
        }
      }),
      nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
    }
  }

  async products(scope: DashboardScope): Promise<ProductRow[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_product_breakdown', {
      p_org: this.organizationId,
      p_from: scope.range.from.toISOString(),
      p_to: scope.range.to.toISOString(),
      p_outlet: scope.outletId,
    })
    if (error) throw error

    return (
      (data ?? []) as {
        product_id: string
        product_name: string
        outlet_id: string | null
        category: string | null
        price_cents: number | null
        reviews: number | string
        rating: number | string | null
        positive: number | string
        private_feedback: number | string
        scans: number | string
        is_active: boolean
      }[]
    ).map((row) => ({
      id: row.product_id,
      name: row.product_name,
      outletId: row.outlet_id,
      category: row.category,
      priceCents: row.price_cents,
      reviews: int(row.reviews),
      rating: nullableFloat(row.rating),
      positive: int(row.positive),
      privateFeedback: int(row.private_feedback),
      scans: int(row.scans),
      isActive: row.is_active,
    }))
  }

  async team(): Promise<TeamMember[]> {
    const supabase = await serverClient()

    // members_read already limits this to the caller's organizations, so there
    // is no filter here on purpose — letting the policy do it means a mistake
    // in this query cannot widen what comes back.
    const { data, error } = await supabase
      .from('organization_members')
      .select('id, user_id, role, accepted_at, invited_email, profiles (full_name, email), team_assignments (outlet_id)')
      .order('created_at')

    if (error) throw error

    return (
      (data ?? []) as unknown as {
        id: string
        user_id: string
        role: string
        accepted_at: string | null
        invited_email: string | null
        profiles: { full_name: string | null; email: string | null } | null
        team_assignments: { outlet_id: string }[]
      }[]
    ).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.profiles?.full_name ?? null,
      email: row.profiles?.email ?? row.invited_email ?? null,
      role: row.role,
      acceptedAt: row.accepted_at,
      assignedOutletIds: (row.team_assignments ?? []).map((a) => a.outlet_id),
    }))
  }

  async organization(): Promise<OrganizationDetail | null> {
    const supabase = await serverClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, short_code, category, city, country, subscriptions (plan_code, status, plans (name))')
      .eq('id', this.organizationId)
      .maybeSingle()

    if (error || !data) return null

    const row = data as unknown as {
      id: string
      name: string
      slug: string
      short_code: string
      category: string | null
      city: string | null
      country: string | null
      subscriptions: { plan_code: string; status: string; plans: { name: string } | null } | null
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortCode: row.short_code,
      category: row.category,
      city: row.city,
      country: row.country,
      planCode: row.subscriptions?.plan_code ?? null,
      planName: row.subscriptions?.plans?.name ?? null,
      subscriptionStatus: row.subscriptions?.status ?? null,
    }
  }

  /**
   * Per-channel click-throughs, and whether that channel is set up at all.
   *
   * What comes back is customers this business sent to a platform. It is not
   * "reviews on Google" — no platform confirms a posting, so a number claiming
   * to be their review count would be one we invented. A channel with neither
   * traffic nor configuration is absent from the function's rows and is filled
   * in here as an unconfigured zero, so the dashboard can always show the full
   * set in a stable order.
   */
  async channels(scope: DashboardScope): Promise<ChannelRow[]> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_channel_breakdown', {
      p_org: this.organizationId,
      p_from: scope.range.from,
      p_to: scope.range.to,
      p_outlet: scope.outletId ?? null,
    })

    if (error) throw error

    const rows = (data ?? []) as { destination: string; clicks: number; configured: boolean }[]
    return CHANNELS.map((channel) => {
      const row = rows.find((entry) => entry.destination === channel)
      return {
        channel: channel as ChannelKey,
        clicks: int(row?.clicks),
        configured: Boolean(row?.configured),
      }
    })
  }

  /**
   * Live totals. Counted at read time rather than metered, for the same reason
   * the quota checks count: a stored counter drifts the first time something is
   * deleted, and then the dashboard and the limit disagree.
   */
  async counts(): Promise<WorkspaceCounts> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_quota_usage', { p_org: this.organizationId })
    if (error) throw error

    const rows = (data ?? []) as { metric: string; used: number }[]
    const used = (metric: string) => int(rows.find((row) => row.metric === metric)?.used)

    return {
      outlets: used('outlets'),
      campaigns: used('qr_campaigns'),
      products: used('products'),
      teamMembers: used('team_members'),
    }
  }

  /** What the feedback tabs count — all of it, not just the page on screen. */
  async feedbackStatusCounts(scope: DashboardScope): Promise<FeedbackStatusCounts> {
    const supabase = await serverClient()
    const { data, error } = await supabase.rpc('app_feedback_status_counts', {
      p_org: this.organizationId,
      p_from: scope.range.from,
      p_to: scope.range.to,
      p_outlet: scope.outletId ?? null,
    })
    if (error) throw error

    const rows = (data ?? []) as { status: string; count: number | string }[]
    const of = (status: string) => int(rows.find((row) => row.status === status)?.count)

    return {
      new: of('new'),
      reviewed: of('reviewed'),
      responded: of('responded'),
      resolved: of('resolved'),
      total: rows.reduce((sum, row) => sum + int(row.count), 0),
    }
  }

  async invites(): Promise<PendingInvite[]> {
    const supabase = await serverClient()
    // invites_read limits this to organizations the caller administers, so a
    // staff member gets an empty list rather than a refusal.
    const { data, error } = await supabase
      .from('organization_invites')
      .select('id, email, role, created_at, expires_at')
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    return (
      (data ?? []) as { id: string; email: string; role: string; created_at: string; expires_at: string }[]
    ).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }))
  }
}
