import { serverClient, serviceClient } from './supabase.server'
import { isSupabaseConfigured } from './supabase'
import { PLANS, UNLIMITED, planByCode, type QuotaKey } from '@/lib/plans'
import { reportError } from '@/lib/observability'

/**
 * Plan limits, enforced.
 *
 * `plans.limits` has been data since 0003 and nothing read it, so every plan
 * was effectively unlimited. This is where that stops.
 *
 * Two kinds of limit, treated differently on purpose:
 *
 *   Live totals — outlets, campaigns, team members, products — are counted at
 *   the moment of the check. A stored counter would drift the first time
 *   something is deleted, and then either block a customer who is under their
 *   limit or let one sail past it.
 *
 *   Consumables — AI drafts — are metered into usage_counters, because "how
 *   many did you use this month" cannot be recovered by counting anything.
 *
 * The usage read goes through the caller's own client, so row level security
 * decides what is countable. Recording usage goes through the service role,
 * because usage_counters deliberately has no client insert policy: a browser
 * must not be able to write its own meter.
 */

export type QuotaVerdict = {
  allowed: boolean
  used: number
  limit: number
  /** Null when the plan allows this without limit. */
  remaining: number | null
  message?: string
}

const ALLOWED: QuotaVerdict = { allowed: true, used: 0, limit: UNLIMITED, remaining: null }

async function planLimitsFor(organizationId: string) {
  const supabase = await serverClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan_code, plans (limits)')
    .eq('organization_id', organizationId)
    .maybeSingle()

  const row = data as unknown as { plan_code: string; plans: { limits: Record<string, number | boolean> } | null } | null
  // A workspace with no subscription row is on the free plan, not on an
  // unlimited one. Defaulting the other way would make a missing row a way
  // around every limit.
  return (row?.plans?.limits as Record<string, number> | undefined) ?? planByCode(row?.plan_code ?? 'FREE')?.limits ?? PLANS.FREE.limits
}

async function usageFor(organizationId: string): Promise<Map<string, number>> {
  const supabase = await serverClient()
  const { data, error } = await supabase.rpc('app_quota_usage', { p_org: organizationId })
  if (error) throw error
  return new Map(
    ((data ?? []) as { metric: string; used: number | string }[]).map((row) => [
      row.metric,
      Number(row.used) || 0,
    ]),
  )
}

/** Whether one more of `metric` may be created right now. */
export async function checkQuota(organizationId: string, metric: QuotaKey): Promise<QuotaVerdict> {
  if (!isSupabaseConfigured()) return ALLOWED

  try {
    const [limits, usage] = await Promise.all([planLimitsFor(organizationId), usageFor(organizationId)])
    const limit = Number(limits[metric] ?? UNLIMITED)
    if (limit === UNLIMITED) return ALLOWED

    const used = usage.get(metric) ?? 0
    return {
      allowed: used < limit,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      message:
        used < limit
          ? undefined
          : `Your plan includes ${limit} ${metric.replace(/_/g, ' ')}. Upgrade to add more.`,
    }
  } catch (error) {
    // A quota check that cannot run must not block the customer's business.
    // The limit is a commercial boundary, not a security one — unlike the
    // policies, which are never bypassed on error.
    reportError('quota.check', error, { metric })
    return ALLOWED
  }
}

/** Records consumable usage. Never throws: metering must not fail the action. */
export async function recordUsage(
  organizationId: string,
  metric: QuotaKey,
  amount = 1,
): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    const { error } = await serviceClient().rpc('app_record_usage', {
      p_org: organizationId,
      p_metric: metric,
      p_amount: amount,
    })
    if (error) throw error
  } catch (error) {
    reportError('quota.check', error, { metric, recording: true })
  }
}
