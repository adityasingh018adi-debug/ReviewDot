import type { DashboardScope } from './scope'

/**
 * What a dashboard page asks for, independent of where it comes from.
 *
 * Two implementations sit behind this: one reading Postgres through the
 * caller's own JWT, one reading the seeded dataset. Views take the results as
 * props and no longer know which they are looking at — which is what lets the
 * seeded path be deleted page by page instead of all at once.
 */

export type OverviewStats = {
  scans: number
  reviews: number
  /** Null when there is no feedback in the window — not zero, which would be a rating. */
  rating: number | null
  googleClicks: number
  positive: number
  negative: number
  /** Reviews per scan. Null when nothing was scanned. */
  conversion: number | null
  trends: {
    scans: number
    reviews: number
    rating: number
    conversion: number
  }
}

export type SeriesPoint = { date: string; scans: number; reviews: number }

export type OutletRow = {
  id: string
  name: string
  scans: number
  reviews: number
  rating: number | null
}

export type RatingBucket = { rating: number; count: number; share: number }

export type OutletStatus = 'active' | 'paused' | 'archived'

export type OutletDetail = {
  id: string
  name: string
  shortCode: string
  city: string | null
  address: string | null
  googleReviewUrl: string | null
  status: OutletStatus
  campaigns: number
  scans: number
  reviews: number
  rating: number | null
}

export type CampaignStatus = 'active' | 'paused' | 'archived'

export type CampaignRow = {
  id: string
  name: string
  /** The /r/{publicId} segment. Unguessable, and the only thing used for lookups. */
  publicId: string
  /** The printed label, e.g. RD-LL-TH-T04. Never used for lookups. */
  referenceCode: string
  type: string
  placement: string | null
  status: CampaignStatus
  destination: string
  outletId: string
  outletName: string | null
  productName: string | null
  createdAt: string
  scans: number
  reviews: number
  clicks: number
}

export type FeedbackItem = {
  id: string
  createdAt: string
  rating: number
  comment: string | null
  tags: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | null
  status: 'new' | 'reviewed' | 'responded' | 'resolved'
  outletName: string | null
  productName: string | null
}

export type ProductRow = {
  id: string
  name: string
  outletId: string | null
  reviews: number
  rating: number | null
  positive: number
  isActive: boolean
}

export type TeamMember = {
  id: string
  userId: string
  name: string | null
  email: string | null
  role: string
  acceptedAt: string | null
  assignedOutletIds: string[]
}

export type OrganizationDetail = {
  id: string
  name: string
  slug: string
  shortCode: string
  category: string | null
  city: string | null
  country: string | null
  planCode: string | null
  planName: string | null
  subscriptionStatus: string | null
}

export type TagRow = { tag: string; mentions: number; positive: number; avgRating: number | null }

/** Where the journey loses people, step by step. */
export type Funnel = {
  scans: number
  sessions: number
  feedback: number
  drafts: number
  approved: number
  clicks: number
}

export type CustomerRow = {
  /** Email if they gave one, otherwise phone. Never both — it is the grouping key. */
  contact: string
  name: string | null
  visits: number
  avgRating: number | null
  lastSeen: string
}

/** Feedback that became a public review: the customer approved a draft and clicked through. */
export type ReviewItem = FeedbackItem & {
  /** What the customer settled on, which may differ from what the model wrote. */
  finalText: string | null
  editedByCustomer: boolean
  destination: string | null
  postedAt: string | null
}

/** Keyset, not offset: page two stays correct while page one keeps growing. */
export type Page<T> = { items: T[]; nextCursor: string | null }

export type FeedbackFilter = {
  /** Only feedback at or below this rating — the triage view. */
  maxRating?: number
  /** Only feedback tied to one product. */
  productId?: string
  status?: FeedbackItem['status']
  cursor?: string | null
  limit?: number
}

export type OutletOption = { id: string; name: string; city?: string | null }

export interface DashboardRepo {
  /** Every outlet the viewer can see, for the outlet picker. Cheap and unscoped by date. */
  outletOptions(): Promise<OutletOption[]>
  overview(scope: DashboardScope): Promise<OverviewStats>
  series(scope: DashboardScope): Promise<SeriesPoint[]>
  outlets(scope: DashboardScope): Promise<OutletRow[]>
  ratingDistribution(scope: DashboardScope): Promise<RatingBucket[]>
  feedback(scope: DashboardScope, filter?: FeedbackFilter): Promise<Page<FeedbackItem>>
  outletsDetail(scope: DashboardScope): Promise<OutletDetail[]>
  campaigns(scope: DashboardScope): Promise<CampaignRow[]>
  tags(scope: DashboardScope): Promise<TagRow[]>
  funnel(scope: DashboardScope): Promise<Funnel>
  customers(scope: DashboardScope): Promise<CustomerRow[]>
  reviews(scope: DashboardScope, filter?: FeedbackFilter): Promise<Page<ReviewItem>>
  products(scope: DashboardScope): Promise<ProductRow[]>
  team(): Promise<TeamMember[]>
  organization(): Promise<OrganizationDetail | null>
}

export const PAGE_SIZE = 25

/**
 * A cursor is the sort key of the last row seen: created_at and id together,
 * because timestamps collide and a tie would silently drop or repeat a row.
 * Base64 only so it reads as opaque; there is nothing secret in it.
 */
export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url')
}

export function decodeCursor(cursor: string | null | undefined): { createdAt: string; id: string } | null {
  if (!cursor) return null
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|')
    if (!createdAt || !id) return null
    if (Number.isNaN(Date.parse(createdAt))) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

/** Fills 1–5 so the chart keeps its shape when a rating has no feedback. */
export function fillRatingBuckets(counts: { rating: number; count: number }[]): RatingBucket[] {
  const total = counts.reduce((sum, entry) => sum + entry.count, 0)
  return [5, 4, 3, 2, 1].map((rating) => {
    const count = counts.find((entry) => entry.rating === rating)?.count ?? 0
    return { rating, count, share: total ? count / total : 0 }
  })
}
