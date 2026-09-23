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

/** Keyset, not offset: page two stays correct while page one keeps growing. */
export type Page<T> = { items: T[]; nextCursor: string | null }

export type FeedbackFilter = {
  /** Only feedback at or below this rating — the triage view. */
  maxRating?: number
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
