'use server'

import { revalidatePath } from 'next/cache'
import { serverClient } from '@/services/supabase.server'
import { getWorkspaceSession } from '@/services/auth.server'
import { isSupabaseConfigured } from '@/services/supabase'
import { generatePublicId, referenceCode, shortCodeFor } from '@/lib/qr-identity'
import { reportError } from '@/lib/observability'
import { checkQuota } from '@/services/quota.server'

/**
 * Outlets and QR campaigns, created and edited by the business.
 *
 * Everything here goes through serverClient(), which carries the signed-in
 * user's JWT — so `outlets_write` and `campaigns_write` decide who may do what,
 * including the rule that an OUTLET_MANAGER may create campaigns only for an
 * outlet they are assigned to. Using the service role here would work and would
 * silently remove that.
 *
 * `organization_id` comes from the session, never from the form. The browser
 * supplying it is the exact thing the policies exist to distrust.
 */

export type ActionResult = { error?: string; ok?: true }

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

const NOT_LIVE: ActionResult = { error: 'This deployment has no database configured.' }

async function workspace() {
  if (!isSupabaseConfigured()) return null
  const session = await getWorkspaceSession()
  return session?.active ? session.active : null
}

/** Anything a customer could be sent to has to be somewhere we meant to send them. */
function validUrl(value: string): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

/* ---------------------------------------------------------------- outlets */

export async function createOutletAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const name = field(form, 'name')
  if (!name) return { error: 'Enter a name for the outlet.' }

  const reviewUrl = field(form, 'googleReviewUrl')
  if (reviewUrl && !validUrl(reviewUrl)) return { error: 'That review link is not a valid URL.' }

  const quota = await checkQuota(active.organizationId, 'outlets')
  if (!quota.allowed) return { error: quota.message }

  const supabase = await serverClient()

  // short_code is unique per organization and is printed on collateral, so a
  // collision is resolved rather than surfaced to the person naming an outlet.
  const base = shortCodeFor(name)
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shortCode = attempt === 0 ? base : `${base.slice(0, 3)}${attempt}`
    const { error } = await supabase.from('outlets').insert({
      organization_id: active.organizationId,
      name,
      short_code: shortCode,
      city: field(form, 'city') || null,
      address: field(form, 'address') || null,
      google_review_url: validUrl(reviewUrl),
    })

    if (!error) {
      revalidatePath('/app', 'layout')
      return { ok: true }
    }
    if (error.code !== '23505') {
      reportError('outlet.write', error.message, { code: error.code })
      return { error: 'Could not create that outlet.' }
    }
  }

  return { error: 'Could not allocate a short code for that name. Try a different one.' }
}

export async function updateOutletAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const id = field(form, 'id')
  const name = field(form, 'name')
  if (!id) return { error: 'Missing outlet.' }
  if (!name) return { error: 'Enter a name for the outlet.' }

  const reviewUrl = field(form, 'googleReviewUrl')
  if (reviewUrl && !validUrl(reviewUrl)) return { error: 'That review link is not a valid URL.' }

  const supabase = await serverClient()
  // No organization filter: the policy already limits this to outlets the
  // caller may write, and adding one here would imply it is what protects them.
  const { error } = await supabase
    .from('outlets')
    .update({
      name,
      city: field(form, 'city') || null,
      address: field(form, 'address') || null,
      google_review_url: validUrl(reviewUrl),
    })
    .eq('id', id)

  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: 'Could not save that outlet.' }
  }
  revalidatePath('/app', 'layout')
  return { ok: true }
}

export async function setOutletStatusAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const id = field(form, 'id')
  const status = field(form, 'status')
  if (!id || !['active', 'paused', 'archived'].includes(status)) return { error: 'Unknown status.' }

  const supabase = await serverClient()
  const { error } = await supabase.from('outlets').update({ status }).eq('id', id)
  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: 'Could not change that outlet.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}

/* -------------------------------------------------------------- campaigns */

const CAMPAIGN_TYPES = [
  'table',
  'counter',
  'receipt',
  'packaging',
  'delivery',
  'staff',
  'product',
  'event',
  'custom',
]

export async function createCampaignAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const name = field(form, 'name')
  const outletId = field(form, 'outletId')
  const type = field(form, 'type')
  if (!name) return { error: 'Give this code a name.' }
  if (!outletId) return { error: 'Choose an outlet.' }
  if (!CAMPAIGN_TYPES.includes(type)) return { error: 'Choose a placement type.' }

  const quota = await checkQuota(active.organizationId, 'qr_campaigns')
  if (!quota.allowed) return { error: quota.message }

  const supabase = await serverClient()

  const { data: outlet } = await supabase
    .from('outlets')
    .select('id, name, short_code, organization_id')
    .eq('id', outletId)
    .maybeSingle()

  // RLS already hid outlets the caller cannot see, so a miss means they picked
  // one that is not theirs.
  if (!outlet) return { error: 'That outlet is not available.' }

  const { data: org } = await supabase
    .from('organizations')
    .select('short_code')
    .eq('id', active.organizationId)
    .maybeSingle()

  const placement = field(form, 'placement') || null
  const reference = referenceCode({
    orgShortCode: org?.short_code ?? shortCodeFor(active.organizationName),
    outletShortCode: outlet.short_code,
    placement: placement ?? undefined,
  })

  for (let attempt = 0; attempt < 5; attempt += 1) {
    // Crypto-random and unguessable: this is the /r/{id} segment, and an
    // enumerable one would let anyone find and submit against any campaign.
    const publicId = generatePublicId()
    const { error } = await supabase.from('qr_campaigns').insert({
      organization_id: active.organizationId,
      outlet_id: outlet.id,
      name,
      public_id: publicId,
      // reference_code is unique per organization; the attempt suffix keeps two
      // codes on the same table from colliding on the printed label.
      reference_code: attempt === 0 ? reference : `${reference}-${attempt + 1}`,
      type,
      placement,
      destination: 'google',
    })

    if (!error) {
      revalidatePath('/app', 'layout')
      return { ok: true }
    }
    if (error.code !== '23505') {
      reportError('campaign.write', error.message, { code: error.code })
      return { error: 'Could not create that QR code.' }
    }
  }

  return { error: 'Could not allocate a code. Please try again.' }
}

export async function updateCampaignAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const id = field(form, 'id')
  const name = field(form, 'name')
  if (!id) return { error: 'Missing code.' }
  if (!name) return { error: 'Give this code a name.' }

  const supabase = await serverClient()
  const { error } = await supabase
    .from('qr_campaigns')
    .update({ name, placement: field(form, 'placement') || null })
    .eq('id', id)

  if (error) {
    reportError('campaign.write', error.message, { code: error.code })
    return { error: 'Could not save that QR code.' }
  }
  revalidatePath('/app', 'layout')
  return { ok: true }
}

/**
 * Pausing is the whole point of a dynamic code: the printed card keeps working
 * as an object, and app_campaign_is_live() stops accepting submissions through
 * it without anyone reprinting anything.
 */
export async function setCampaignStatusAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const id = field(form, 'id')
  const status = field(form, 'status')
  if (!id || !['active', 'paused', 'archived'].includes(status)) return { error: 'Unknown status.' }

  const supabase = await serverClient()
  const { error } = await supabase.from('qr_campaigns').update({ status }).eq('id', id)
  if (error) {
    reportError('campaign.write', error.message, { code: error.code })
    return { error: 'Could not change that QR code.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}

/* --------------------------------------------------------------- products */

export async function saveProductAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const name = field(form, 'name')
  if (!name) return { error: 'Give the product a name.' }

  const id = field(form, 'id')
  const outletId = field(form, 'outletId')
  const priceText = field(form, 'price')
  const price = priceText ? Math.round(Number(priceText) * 100) : null
  if (priceText && (!Number.isFinite(price) || price! < 0)) return { error: 'That price is not a number.' }

  const supabase = await serverClient()
  const payload = {
    name,
    category: field(form, 'category') || null,
    price_cents: price,
    // null means the product belongs to the whole organization rather than one
    // outlet, which the policy treats differently — only admins manage those.
    outlet_id: outletId || null,
  }

  const { error } = id
    ? await supabase.from('products').update(payload).eq('id', id)
    : await supabase.from('products').insert({ organization_id: active.organizationId, ...payload })

  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: id ? 'Could not save that product.' : 'Could not create that product.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}

export async function setProductActiveAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const id = field(form, 'id')
  if (!id) return { error: 'Missing product.' }

  const supabase = await serverClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active: field(form, 'active') === 'true' })
    .eq('id', id)

  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: 'Could not change that product.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}

/* --------------------------------------------------------------- settings */

export async function updateOrganizationAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const name = field(form, 'name')
  if (!name) return { error: 'Enter a business name.' }

  const supabase = await serverClient()
  // slug and short_code are deliberately not editable here: they are printed on
  // collateral and embedded in reference codes, so changing one silently
  // invalidates cards that are already on tables.
  const { error } = await supabase
    .from('organizations')
    .update({
      name,
      category: field(form, 'category') || null,
      city: field(form, 'city') || null,
      country: field(form, 'country') || null,
    })
    .eq('id', active.organizationId)

  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: 'Could not save those details.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}

const ROLES = ['OWNER', 'ADMIN', 'REGIONAL_MANAGER', 'OUTLET_MANAGER', 'STAFF']

export async function setMemberRoleAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const memberId = field(form, 'memberId')
  const role = field(form, 'role')
  if (!memberId || !ROLES.includes(role)) return { error: 'Unknown role.' }

  const supabase = await serverClient()

  // An organization without an owner cannot be administered by anyone, and
  // there is no policy that can express "not the last one" — so it is checked
  // here, before the update rather than after.
  const { data: member } = await supabase
    .from('organization_members')
    .select('id, role, user_id')
    .eq('id', memberId)
    .maybeSingle()

  if (!member) return { error: 'That member is not available.' }

  if (member.role === 'OWNER' && role !== 'OWNER') {
    const { count } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', active.organizationId)
      .eq('role', 'OWNER')

    if ((count ?? 0) <= 1) {
      return { error: 'This is the only owner. Make someone else an owner first.' }
    }
  }

  const { error } = await supabase.from('organization_members').update({ role }).eq('id', memberId)
  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: 'Could not change that role.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}

export async function removeMemberAction(form: FormData): Promise<ActionResult> {
  const active = await workspace()
  if (!active) return NOT_LIVE

  const memberId = field(form, 'memberId')
  if (!memberId) return { error: 'Missing member.' }

  const supabase = await serverClient()
  const { data: member } = await supabase
    .from('organization_members')
    .select('id, role, user_id')
    .eq('id', memberId)
    .maybeSingle()

  if (!member) return { error: 'That member is not available.' }
  if (member.role === 'OWNER') return { error: 'Transfer ownership before removing an owner.' }

  const { error } = await supabase.from('organization_members').delete().eq('id', memberId)
  if (error) {
    reportError('outlet.write', error.message, { code: error.code })
    return { error: 'Could not remove that member.' }
  }

  revalidatePath('/app', 'layout')
  return { ok: true }
}
