'use server'

import { headers } from 'next/headers'
import { isSupabaseConfigured } from '@/services/supabase'
import { serviceClient } from '@/services/supabase.server'
import { resolveScan, type ScanContext } from '@/services/scan-context'
import { trimHeader, visitorHash } from '@/services/visitor.server'
import { attempt, reportError } from '@/lib/observability'
import { checkQuota, recordUsage } from '@/services/quota.server'
import { clientIp } from '@/lib/rate-limit'
import { checkLimit } from '@/services/rate-limit.server'
import type { DestinationKind, ReviewEventKind } from '@/services/types'

/**
 * The customer journey, recorded.
 *
 *   scan → session → feedback → draft → approval → destination click
 *
 * Every step is written by the service role, because the anonymous role
 * deliberately cannot read campaigns, and because ai_review_drafts and
 * review_events have no client insert policy at all — a browser must not be
 * able to forge a draft or a review click.
 *
 * That makes the trust boundary the important part of this file. Each action
 * takes the `public_id` from the URL, which is public by definition, and
 * re-resolves the campaign server-side rather than accepting an organization or
 * outlet from the caller. Ids the client carries between steps — session,
 * feedback, draft — are each checked against that resolved campaign before they
 * are used, so a caller cannot attach their journey to another tenant's row.
 *
 * Failures are swallowed so a database problem never stops someone leaving
 * feedback, but they are reported first: see lib/observability.
 */

/** Generous: a whole café can share one address, and none of them should be turned away. */
const SCAN_LIMIT = { max: 60, windowSeconds: 60 }
/** A person cannot submit more than this by hand. */
const WRITE_LIMIT = { max: 12, windowSeconds: 60 }

async function requestFacts() {
  const list = await headers()
  return {
    ip: clientIp(list),
    userAgent: trimHeader(list.get('user-agent')),
    referrer: trimHeader(list.get('referer')),
  }
}

/**
 * Re-resolves the campaign from the public id. Returns null when the code is
 * unknown, paused or archived — in which case nothing is recorded, which is the
 * same rule the scan page itself applies.
 */
async function liveContext(publicId: string): Promise<ScanContext | null> {
  const lookup = await resolveScan(publicId)
  return lookup.status === 'ok' ? lookup.context : null
}

/** Confirms a row the client is carrying really belongs to this campaign. */
async function belongsToCampaign(
  table: 'customer_sessions' | 'customer_feedback' | 'ai_review_drafts',
  id: string,
  context: ScanContext,
): Promise<boolean> {
  const column = table === 'ai_review_drafts' ? 'organization_id' : 'campaign_id'
  const expected = table === 'ai_review_drafts' ? context.organizationId : context.campaignId

  const { data } = await serviceClient().from(table).select(column).eq('id', id).maybeSingle()
  return Boolean(data && (data as Record<string, string>)[column] === expected)
}

/* ------------------------------------------------------------------ scan */

export type ScanRecord = { sessionId: string | null }

/**
 * Records the scan and opens a session for this journey. Called by the scan
 * page as it renders, so it runs once per page view.
 */
export async function recordScan(publicId: string): Promise<ScanRecord> {
  if (!isSupabaseConfigured()) return { sessionId: null }

  const context = await liveContext(publicId)
  if (!context) return { sessionId: null }

  const { ip, userAgent, referrer } = await requestFacts()

  // Over the limit the page still renders — the customer is never turned away.
  // Only the telemetry write is dropped.
  if (!(await checkLimit(`scan:${ip}:${context.campaignId}`, SCAN_LIMIT.max, SCAN_LIMIT.windowSeconds)).ok) {
    return { sessionId: null }
  }

  return (
    (await attempt('scan.record', { campaignId: context.campaignId }, async () => {
      const supabase = serviceClient()
      const hash = visitorHash(ip, userAgent ?? '')

      const { data: scan, error: scanError } = await supabase
        .from('qr_scans')
        .insert({
          organization_id: context.organizationId,
          outlet_id: context.outletId,
          campaign_id: context.campaignId,
          visitor_hash: hash,
          user_agent: userAgent,
          referrer,
        })
        .select('id')
        .single()

      if (scanError) throw scanError

      const { data: session, error: sessionError } = await supabase
        .from('customer_sessions')
        .insert({
          organization_id: context.organizationId,
          outlet_id: context.outletId,
          campaign_id: context.campaignId,
          scan_id: scan.id,
          visitor_hash: hash,
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError

      return { sessionId: session.id as string }
    })) ?? { sessionId: null }
  )
}

/* -------------------------------------------------------------- feedback */

export type FeedbackRecord = { feedbackId: string | null }

export async function submitFeedback(
  publicId: string,
  input: { rating: number; tags: string[]; comment: string; sessionId: string | null },
): Promise<FeedbackRecord> {
  const rating = Math.round(Number(input.rating))
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { feedbackId: null }
  if (!isSupabaseConfigured()) return { feedbackId: null }

  const context = await liveContext(publicId)
  if (!context) return { feedbackId: null }

  const { ip } = await requestFacts()
  if (!(await checkLimit(`feedback:${ip}`, WRITE_LIMIT.max, WRITE_LIMIT.windowSeconds)).ok) {
    reportError('feedback.submit', 'rate limited', { campaignId: context.campaignId })
    return { feedbackId: null }
  }

  // A session id from another campaign is dropped rather than trusted; the
  // feedback is still worth keeping, just without the journey link.
  const sessionId =
    input.sessionId && (await belongsToCampaign('customer_sessions', input.sessionId, context))
      ? input.sessionId
      : null

  return (
    (await attempt('feedback.submit', { campaignId: context.campaignId }, async () => {
      const { data, error } = await serviceClient()
        .from('customer_feedback')
        .insert({
          organization_id: context.organizationId,
          outlet_id: context.outletId,
          campaign_id: context.campaignId,
          session_id: sessionId,
          product_id: context.productId ?? null,
          rating,
          tags: input.tags.slice(0, 12),
          comment: input.comment.slice(0, 2000),
          sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
        })
        .select('id')
        .single()

      if (error) throw error
      return { feedbackId: data.id as string }
    })) ?? { feedbackId: null }
  )
}

/* ----------------------------------------------------------------- draft */

export type DraftRecord = { draftId: string | null }

/**
 * Stores the draft the model produced, against the feedback it came from.
 *
 * `source_text` is read from the feedback row rather than taken from the
 * caller: it is the provenance of the whole thing — what the customer actually
 * wrote — and it is the one field here that must not be client-supplied.
 */
export async function saveDraft(
  publicId: string,
  input: { feedbackId: string; draftText: string; model?: string | null },
): Promise<DraftRecord> {
  if (!isSupabaseConfigured()) return { draftId: null }
  if (!input.feedbackId || !input.draftText.trim()) return { draftId: null }

  const context = await liveContext(publicId)
  if (!context) return { draftId: null }

  const { ip } = await requestFacts()
  if (!(await checkLimit(`draft:${ip}`, WRITE_LIMIT.max, WRITE_LIMIT.windowSeconds)).ok) return { draftId: null }

  // Over the monthly allowance the draft is still shown to the customer — they
  // are mid-journey and the business's billing is not their problem — but it is
  // not stored, and nothing is metered for it.
  const quota = await checkQuota(context.organizationId, 'ai_drafts_per_month')
  if (!quota.allowed) {
    reportError('draft.save', 'AI draft quota reached', {
      organizationId: context.organizationId,
      used: quota.used,
      limit: quota.limit,
    })
    return { draftId: null }
  }

  return (
    (await attempt('draft.save', { campaignId: context.campaignId }, async () => {
      const supabase = serviceClient()

      const { data: feedback } = await supabase
        .from('customer_feedback')
        .select('id, comment, campaign_id')
        .eq('id', input.feedbackId)
        .maybeSingle()

      if (!feedback || feedback.campaign_id !== context.campaignId) {
        throw new Error('feedback does not belong to this campaign')
      }

      const { data, error } = await supabase
        .from('ai_review_drafts')
        .insert({
          organization_id: context.organizationId,
          outlet_id: context.outletId,
          feedback_id: feedback.id,
          source_text: feedback.comment ?? '',
          draft_text: input.draftText.slice(0, 4000),
          model: input.model ?? null,
          status: 'generated',
        })
        .select('id')
        .single()

      if (error) throw error
      await recordUsage(context.organizationId, 'ai_drafts_per_month')
      return { draftId: data.id as string }
    })) ?? { draftId: null }
  )
}

/**
 * Records what the customer settled on. `edited_by_customer` is derived here by
 * comparing against the stored draft, not taken from the caller — it is the
 * field that says whether the words are the model's or the customer's own, so
 * it should not be something a payload can assert.
 */
export async function approveDraft(
  publicId: string,
  input: { draftId: string; finalText: string },
): Promise<void> {
  if (!isSupabaseConfigured() || !input.draftId) return

  const context = await liveContext(publicId)
  if (!context) return

  const { ip } = await requestFacts()
  if (!(await checkLimit(`approve:${ip}`, WRITE_LIMIT.max, WRITE_LIMIT.windowSeconds)).ok) return

  await attempt('draft.approve', { campaignId: context.campaignId }, async () => {
    const supabase = serviceClient()

    const { data: draft } = await supabase
      .from('ai_review_drafts')
      .select('id, draft_text, organization_id')
      .eq('id', input.draftId)
      .maybeSingle()

    if (!draft || draft.organization_id !== context.organizationId) {
      throw new Error('draft does not belong to this organization')
    }

    const finalText = input.finalText.slice(0, 4000)
    const { error } = await supabase
      .from('ai_review_drafts')
      .update({
        final_text: finalText,
        status: 'approved',
        approved_at: new Date().toISOString(),
        edited_by_customer: finalText.trim() !== String(draft.draft_text).trim(),
      })
      .eq('id', draft.id)

    if (error) throw error
  })
}

/* -------------------------------------------------------- review events */

/**
 * The customer chose somewhere to post. The platform never learns whether they
 * actually posted, so this records the click-through and nothing more — which
 * is exactly what the column comment on review_events says.
 */
export async function recordDestinationClick(
  publicId: string,
  input: {
    feedbackId: string | null
    draftId: string | null
    sessionId: string | null
    kind: DestinationKind
    url: string
    /**
     * What the customer did. Defaults to the weakest true statement: the
     * platform was opened. Never 'submitted' — see 0017.
     */
    event?: ReviewEventKind
  },
): Promise<void> {
  if (!isSupabaseConfigured()) return

  const context = await liveContext(publicId)
  if (!context) return

  const { ip } = await requestFacts()
  if (!(await checkLimit(`event:${ip}`, WRITE_LIMIT.max, WRITE_LIMIT.windowSeconds)).ok) return

  // The destination must be one this outlet actually configured. Taking the url
  // from the caller and storing it would let a payload write an arbitrary link
  // into the business's own analytics.
  const destination = context.destinations.find((entry) => entry.kind === input.kind)
  if (!destination) return

  // A caller could ask for 'submitted'; no caller is allowed to have it. Only
  // a platform confirming a posting could justify that, and none does.
  const event: ReviewEventKind =
    input.event && input.event !== 'submitted' ? input.event : 'opened'

  await attempt(
    'review.event',
    { campaignId: context.campaignId, kind: input.kind, event },
    async () => {
      const supabase = serviceClient()

      const feedbackId =
        input.feedbackId && (await belongsToCampaign('customer_feedback', input.feedbackId, context))
          ? input.feedbackId
          : null
      const draftId =
        input.draftId && (await belongsToCampaign('ai_review_drafts', input.draftId, context))
          ? input.draftId
          : null

      const { error } = await supabase.from('review_events').insert({
        organization_id: context.organizationId,
        outlet_id: context.outletId,
        campaign_id: context.campaignId,
        feedback_id: feedbackId,
        draft_id: draftId,
        destination: input.kind,
        destination_url: destination.url,
        kind: event,
      })
      if (error) throw error

      if (
        input.sessionId &&
        (await belongsToCampaign('customer_sessions', input.sessionId, context))
      ) {
        await supabase
          .from('customer_sessions')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', input.sessionId)
      }
    },
  )
}

/** Marks the journey finished when the customer keeps their review private. */
export async function completeSession(publicId: string, sessionId: string | null): Promise<void> {
  if (!isSupabaseConfigured() || !sessionId) return

  const context = await liveContext(publicId)
  if (!context) return
  if (!(await belongsToCampaign('customer_sessions', sessionId, context))) return

  await attempt('scan.session', { campaignId: context.campaignId }, async () => {
    const { error } = await serviceClient()
      .from('customer_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) throw error
  })
}
