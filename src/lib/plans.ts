/**
 * Plan limits.
 *
 * Mirrors the `plans` table seeded in supabase/migrations/0003_plans.sql. Limits
 * are data: no component branches on a plan code. -1 means unlimited.
 */

export const PLAN_CODES = ['FREE', 'STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE'] as const
export type PlanCode = (typeof PLAN_CODES)[number]

export type PlanLimits = {
  outlets: number
  qr_campaigns: number
  team_members: number
  ai_drafts_per_month: number
  analytics_history_days: number
  exports: boolean
  api_access: boolean
  products: boolean
}

export type Plan = {
  code: PlanCode
  name: string
  monthlyPriceCents: number
  yearlyPriceCents: number
  currency: string
  limits: PlanLimits
  tagline: string
  features: string[]
}

export const UNLIMITED = -1

export const PLANS: Record<PlanCode, Plan> = {
  FREE: {
    code: 'FREE',
    name: 'Free',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    currency: 'INR',
    tagline: 'One outlet, everything you need to collect your first reviews.',
    features: ['1 outlet', '10 QR campaigns', 'AI review writer', 'Feedback inbox'],
    limits: {
      outlets: 1,
      qr_campaigns: 10,
      team_members: 2,
      ai_drafts_per_month: 50,
      analytics_history_days: 30,
      exports: false,
      api_access: false,
      products: false,
    },
  },
  STARTER: {
    code: 'STARTER',
    name: 'Starter',
    monthlyPriceCents: 99900,
    yearlyPriceCents: 999000,
    currency: 'INR',
    tagline: 'For a growing business with a handful of outlets.',
    features: ['3 outlets', '50 QR campaigns', 'Product intelligence', 'CSV exports'],
    limits: {
      outlets: 3,
      qr_campaigns: 50,
      team_members: 5,
      ai_drafts_per_month: 500,
      analytics_history_days: 90,
      exports: true,
      api_access: false,
      products: true,
    },
  },
  GROWTH: {
    code: 'GROWTH',
    name: 'Growth',
    monthlyPriceCents: 249900,
    yearlyPriceCents: 2499000,
    currency: 'INR',
    tagline: 'Multi-outlet teams that run on their numbers.',
    features: ['10 outlets', 'Unlimited campaigns', 'AI insights', 'Team roles'],
    limits: {
      outlets: 10,
      qr_campaigns: UNLIMITED,
      team_members: 15,
      ai_drafts_per_month: 2500,
      analytics_history_days: 365,
      exports: true,
      api_access: false,
      products: true,
    },
  },
  BUSINESS: {
    code: 'BUSINESS',
    name: 'Business',
    monthlyPriceCents: 599900,
    yearlyPriceCents: 5999000,
    currency: 'INR',
    tagline: 'Chains and franchises with brand-level reporting.',
    features: ['50 outlets', 'API access', 'Outlet benchmarking', 'Priority support'],
    limits: {
      outlets: 50,
      qr_campaigns: UNLIMITED,
      team_members: 50,
      ai_drafts_per_month: 10000,
      analytics_history_days: 730,
      exports: true,
      api_access: true,
      products: true,
    },
  },
  ENTERPRISE: {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    currency: 'INR',
    tagline: 'Hundreds of outlets, custom terms, dedicated support.',
    features: ['Unlimited outlets', 'Unlimited AI', 'SSO & audit trail', 'Onboarding support'],
    limits: {
      outlets: UNLIMITED,
      qr_campaigns: UNLIMITED,
      team_members: UNLIMITED,
      ai_drafts_per_month: UNLIMITED,
      analytics_history_days: UNLIMITED,
      exports: true,
      api_access: true,
      products: true,
    },
  },
}

export type QuotaKey = 'outlets' | 'qr_campaigns' | 'team_members' | 'ai_drafts_per_month'

export type QuotaCheck = {
  allowed: boolean
  limit: number
  used: number
  remaining: number
  unlimited: boolean
  message?: string
}

/** Whether one more of `key` may be created under `plan`. */
export function checkQuota(plan: Plan, key: QuotaKey, used: number): QuotaCheck {
  const limit = plan.limits[key]
  if (limit === UNLIMITED) {
    return { allowed: true, limit, used, remaining: Infinity, unlimited: true }
  }
  const remaining = Math.max(0, limit - used)
  return {
    allowed: used < limit,
    limit,
    used,
    remaining,
    unlimited: false,
    message:
      used < limit
        ? undefined
        : `Your ${plan.name} plan includes ${limit} ${QUOTA_LABELS[key]}. Upgrade to add more.`,
  }
}

export function hasFeature(plan: Plan, feature: 'exports' | 'api_access' | 'products'): boolean {
  return plan.limits[feature]
}

const QUOTA_LABELS: Record<QuotaKey, string> = {
  outlets: 'outlets',
  qr_campaigns: 'QR campaigns',
  team_members: 'team members',
  ai_drafts_per_month: 'AI drafts per month',
}

export function planByCode(code: string): Plan {
  return PLANS[(code as PlanCode) in PLANS ? (code as PlanCode) : 'FREE']
}
