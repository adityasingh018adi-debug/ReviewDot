import { PLANS, checkQuota, planByCode, type Plan, type QuotaCheck, type QuotaKey } from '@/lib/plans'
import type { BillingService, Subscription, UsageSnapshot } from './types'

/**
 * Billing.
 *
 * Quotas are evaluated against plan data, never hard-coded per component. The
 * local adapter keeps counters in memory so the app runs without a payment
 * provider; a Supabase adapter reads `subscriptions` and `usage_counters`.
 */
export class LocalBillingService implements BillingService {
  private readonly usage = new Map<string, UsageSnapshot>()

  constructor(private readonly plan: Plan = PLANS.GROWTH) {}

  async getSubscription(organizationId: string): Promise<Subscription> {
    return { organizationId, plan: this.plan, status: 'active' }
  }

  async getUsage(organizationId: string): Promise<UsageSnapshot> {
    return (
      this.usage.get(organizationId) ?? {
        outlets: 0,
        qr_campaigns: 0,
        team_members: 0,
        ai_drafts_per_month: 0,
      }
    )
  }

  async checkQuota(organizationId: string, key: QuotaKey): Promise<QuotaCheck> {
    const usage = await this.getUsage(organizationId)
    return checkQuota(this.plan, key, usage[key])
  }

  async recordUsage(organizationId: string, key: QuotaKey, amount = 1): Promise<void> {
    const usage = await this.getUsage(organizationId)
    this.usage.set(organizationId, { ...usage, [key]: usage[key] + amount })
  }
}

/** Shape of the rows a Supabase-backed adapter reads. */
export type SubscriptionRow = { organization_id: string; plan_code: string; status: Subscription['status']; current_period_end?: string }
export type UsageRow = { metric: QuotaKey; value: number }

/**
 * Reads real subscription and usage rows. The reader is injected so this stays
 * free of any client SDK — the Next.js route supplies a Supabase query.
 */
export class RemoteBillingService implements BillingService {
  constructor(
    private readonly read: {
      subscription: (organizationId: string) => Promise<SubscriptionRow | null>
      usage: (organizationId: string) => Promise<UsageRow[]>
      increment: (organizationId: string, metric: QuotaKey, amount: number) => Promise<void>
    },
  ) {}

  async getSubscription(organizationId: string): Promise<Subscription> {
    const row = await this.read.subscription(organizationId)
    return {
      organizationId,
      plan: planByCode(row?.plan_code ?? 'FREE'),
      status: row?.status ?? 'trialing',
      currentPeriodEnd: row?.current_period_end,
    }
  }

  async getUsage(organizationId: string): Promise<UsageSnapshot> {
    const rows = await this.read.usage(organizationId)
    const snapshot: UsageSnapshot = {
      outlets: 0,
      qr_campaigns: 0,
      team_members: 0,
      ai_drafts_per_month: 0,
    }
    for (const row of rows) snapshot[row.metric] = row.value
    return snapshot
  }

  async checkQuota(organizationId: string, key: QuotaKey): Promise<QuotaCheck> {
    const [{ plan }, usage] = await Promise.all([
      this.getSubscription(organizationId),
      this.getUsage(organizationId),
    ])
    return checkQuota(plan, key, usage[key])
  }

  async recordUsage(organizationId: string, key: QuotaKey, amount = 1): Promise<void> {
    await this.read.increment(organizationId, key, amount)
  }
}
