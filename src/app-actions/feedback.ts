'use server'

import { isSupabaseConfigured } from '@/services/supabase'
import { serviceClient } from '@/services/supabase.server'
import type { ScanContext } from '@/services/scan-context'

/**
 * Server actions for the public scan experience.
 *
 * They run with the service role because the anonymous role deliberately cannot
 * read campaigns. Every write is pinned to the campaign the server resolved, so
 * a browser cannot redirect a submission into another tenant by editing a
 * payload: organization and outlet come from the server's lookup, never the
 * request body.
 */

export async function recordScan(context: ScanContext): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    await serviceClient().from('qr_scans').insert({
      organization_id: context.organizationId,
      outlet_id: context.outletId,
      campaign_id: context.campaignId,
    })
  } catch {
    // telemetry must never break the customer's flow
  }
}

export async function submitFeedback(
  context: ScanContext,
  input: { rating: number; tags: string[]; comment: string },
): Promise<void> {
  const rating = Math.round(input.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return
  if (!isSupabaseConfigured()) return

  try {
    await serviceClient()
      .from('customer_feedback')
      .insert({
        organization_id: context.organizationId,
        outlet_id: context.outletId,
        campaign_id: context.campaignId,
        product_id: context.productId ?? null,
        rating,
        tags: input.tags.slice(0, 12),
        comment: input.comment.slice(0, 2000),
        sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
      })
  } catch {
    // a failed write must not block the customer; the draft step continues
  }
}
