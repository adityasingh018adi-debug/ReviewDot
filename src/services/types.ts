/**
 * Service interfaces.
 *
 * Every external capability sits behind an interface so the app can run on a
 * deterministic local adapter today and a real provider later without touching
 * the UI. Adapters live beside each interface; nothing outside this folder
 * imports a provider SDK.
 */

import type { Role } from '@/lib/permissions'
import type { Plan, QuotaCheck, QuotaKey } from '@/lib/plans'

/* ------------------------------------------------------------------ AI */

export type ReviewTone = 'natural' | 'warm' | 'concise' | 'detailed'

/**
 * A Google review and an Instagram caption are not the same text.
 *
 * Four sentences of review prose under a photo reads as the wrong species of
 * writing, so the customer is offered a short version for Instagram rather than
 * the long one with the line breaks removed.
 */
export type ReviewFormat = 'review' | 'caption'

export type ReviewDraftInput = {
  /** Exactly what the customer typed. Never paraphrased before it reaches here. */
  comment: string
  rating: number
  /** Chips the customer selected, e.g. ['Coffee', 'Service']. */
  tags: string[]
  businessName: string
  outletName: string
  productName?: string
  tone?: ReviewTone
  /** Defaults to a full review. */
  format?: ReviewFormat
}

export type ReviewDraft = {
  text: string
  /** True when the draft is built locally rather than by a model. */
  offline: boolean
  model?: string
  /** Claims found in the draft that the customer never made. Should be empty. */
  ungrounded: string[]
}

export interface AIReviewService {
  /** Turns the customer's own words into a polished review they can edit. */
  draftReview(input: ReviewDraftInput): Promise<ReviewDraft>
}

export type ResponseTone = 'professional' | 'friendly' | 'warm' | 'concise'

export type ResponseInput = {
  feedback: string
  rating: number
  businessName: string
  outletName: string
  tone: ResponseTone
}

export interface AIResponseService {
  /** Drafts a business reply to a piece of customer feedback. */
  draftResponse(input: ResponseInput): Promise<{ text: string; offline: boolean }>
}

/* ------------------------------------------------- review destinations */

export type DestinationKind =
  | 'google'
  | 'zomato'
  | 'swiggy'
  | 'instagram'
  | 'tripadvisor'
  | 'facebook'
  | 'custom'

/**
 * What a customer did with a review, in the order it can happen.
 *
 * Deliberately not a single "posted" flag. No platform reports a posting back,
 * so the only honest record is what we watched the customer do: the draft was
 * written, they changed it, they shared or copied it, they opened the platform.
 * `submitted` exists for a platform that one day confirms it, and is never
 * inferred from a click.
 */
export type ReviewEventKind =
  | 'generated'
  | 'edited'
  | 'shared'
  | 'copied'
  | 'opened'
  | 'submitted'

export type Destination = {
  kind: DestinationKind
  label: string
  url: string
}

export interface ReviewDestinationService {
  /** Destinations the business has configured for an outlet. */
  listForOutlet(outletId: string): Promise<Destination[]>
  /** Records that the customer chose to continue to a destination. */
  recordClick(input: { outletId: string; campaignId: string; draftId?: string; kind: DestinationKind }): Promise<void>
}

/* ------------------------------------------------------------ billing */

export type Subscription = {
  organizationId: string
  plan: Plan
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended'
  currentPeriodEnd?: string
}

export type UsageSnapshot = Record<QuotaKey, number>

export interface BillingService {
  getSubscription(organizationId: string): Promise<Subscription>
  getUsage(organizationId: string): Promise<UsageSnapshot>
  /** Whether one more of `key` may be created right now. */
  checkQuota(organizationId: string, key: QuotaKey): Promise<QuotaCheck>
  /** Records metered usage such as an AI draft. */
  recordUsage(organizationId: string, key: QuotaKey, amount?: number): Promise<void>
}

/* ---------------------------------------------------------- analytics */

export type AnalyticsEvent = {
  name: string
  organizationId?: string
  outletId?: string
  campaignId?: string
  props?: Record<string, string | number | boolean>
}

export interface AnalyticsService {
  track(event: AnalyticsEvent): Promise<void>
}

/* ----------------------------------------------------------- identity */

export type SessionUser = {
  id: string
  email: string
  fullName?: string
  isPlatformAdmin: boolean
}

export type Membership = {
  organizationId: string
  organizationName: string
  role: Role
  assignedOutletIds: string[]
}

export interface AuthService {
  getUser(): Promise<SessionUser | null>
  getMemberships(userId: string): Promise<Membership[]>
}
