import { business, demoQR, outletById, productById, products, qrCodes } from '@/lib/data'
import { isSupabaseConfigured } from './supabase'
import { serviceClient } from './supabase.server'
import { destinationsFrom } from './review-destination'
import { referenceCode, shortCodeFor } from '@/lib/qr-identity'
import type { Destination } from './types'

/**
 * Resolving a scanned code.
 *
 * A scan carries only `/r/{public_id}`. Everything else — organization, outlet,
 * campaign, placement, product, destinations — is looked up here, so the
 * customer never picks an outlet and a code cannot be pointed at another tenant
 * by editing the URL.
 */

export type ScanContext = {
  campaignId: string
  publicId: string
  referenceCode: string
  organizationId: string
  organizationName: string
  outletId: string
  outletName: string
  outletCity?: string
  placement?: string
  campaignType: string
  productId?: string
  productName?: string
  productEmoji?: string
  destinations: Destination[]
}

export type ScanLookup =
  | { status: 'ok'; context: ScanContext }
  | { status: 'not-found' }
  | { status: 'paused' }
  | { status: 'archived' }

/**
 * Demo fallback so the product runs end to end before a database exists.
 * Unknown codes must still miss — a wrong code may never reveal a business.
 */
function demoContext(code: string): ScanLookup {
  const qr = code === 'demo' ? demoQR : qrCodes.find((entry) => entry.code === code)
  if (!qr) return { status: 'not-found' }
  if (qr.status === 'paused') return { status: 'paused' }
  if (qr.status === 'archived') return { status: 'archived' }

  const outlet = outletById(qr.outletId)
  const product = qr.productId ? productById(qr.productId) : products[0]
  if (!outlet) return { status: 'not-found' }

  return {
    status: 'ok',
    context: {
      campaignId: qr.id,
      publicId: qr.code,
      // was hard-coded to -T12 regardless of where the code actually sat
      referenceCode:
        qr.reference ??
        referenceCode({
          orgShortCode: shortCodeFor(business.name),
          outletShortCode: shortCodeFor(outlet.name),
          placement: qr.location,
        }),
      organizationId: business.id,
      organizationName: business.name,
      outletId: outlet.id,
      outletName: outlet.name,
      outletCity: outlet.city,
      placement: qr.location,
      campaignType: qr.type,
      productId: product?.id,
      productName: product?.name,
      productEmoji: product?.emoji,
      destinations: destinationsFrom({
        googleReviewUrl: 'https://g.page/r/love-and-latte/review',
        reviewDestinations: [{ kind: 'instagram', url: 'https://instagram.com/loveandlatte' }],
      }),
    },
  }
}

/**
 * Looks a campaign up by its public id. Runs server-side with the service role
 * because the anon role deliberately cannot read campaigns — the scan page is
 * the only thing allowed to resolve one, and only for a live campaign.
 */
export async function resolveScan(publicId: string): Promise<ScanLookup> {
  if (!isSupabaseConfigured()) return demoContext(publicId)

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('qr_campaigns')
    .select(
      `id, public_id, reference_code, type, placement, status, organization_id, outlet_id, product_id,
       organizations!inner (id, name, is_suspended),
       outlets!inner (id, name, city, status, google_review_url, review_destinations),
       products (id, name)`,
    )
    .eq('public_id', publicId)
    .maybeSingle()

  if (error || !data) return { status: 'not-found' }

  const org = data.organizations as unknown as { id: string; name: string; is_suspended: boolean }
  const outlet = data.outlets as unknown as {
    id: string
    name: string
    city: string | null
    status: string
    google_review_url: string | null
    review_destinations: { kind: Destination['kind']; url: string; label?: string }[] | null
  }
  const product = data.products as unknown as { id: string; name: string } | null

  if (org.is_suspended || data.status === 'archived' || outlet.status === 'archived') {
    return { status: 'archived' }
  }
  if (data.status !== 'active' || outlet.status !== 'active') return { status: 'paused' }

  return {
    status: 'ok',
    context: {
      campaignId: data.id,
      publicId: data.public_id,
      referenceCode: data.reference_code,
      organizationId: org.id,
      organizationName: org.name,
      outletId: outlet.id,
      outletName: outlet.name,
      outletCity: outlet.city ?? undefined,
      placement: data.placement ?? undefined,
      campaignType: data.type,
      productId: product?.id,
      productName: product?.name,
      destinations: destinationsFrom({
        googleReviewUrl: outlet.google_review_url,
        reviewDestinations: outlet.review_destinations,
      }),
    },
  }
}
