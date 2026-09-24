import Link from 'next/link'
import { Info } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils'
import type { OrganizationDetail, WorkspaceCounts } from '@/services/dashboard'

/**
 * Plan and usage.
 *
 * The usage figures are real: they are counted live, the same way the quota
 * checks count, so deleting something frees the allowance immediately. What is
 * not here is an invoice history or a payment method, because no payment
 * provider is wired up — and an invoice table showing amounts nobody was
 * charged is worse than no table at all.
 */
export function Billing({
  organization,
  counts,
}: {
  organization: OrganizationDetail | null
  counts: WorkspaceCounts
}) {
  const plan = organization?.planName ?? organization?.planCode ?? 'Free'

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Your plan and what this workspace is using" />

      <Card>
        <CardHeader title="Current plan" subtitle="What this workspace is on today" />
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-[22px] font-bold tracking-tight text-ink">{plan}</span>
          {organization?.subscriptionStatus ? (
            <Badge tone="positive">{organization.subscriptionStatus}</Badge>
          ) : null}
        </div>
        <Link
          href="/pricing"
          className="mt-4 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          Compare plans →
        </Link>
      </Card>

      <Card>
        <CardHeader title="Usage" subtitle="Counted live, so deleting something frees it at once" />
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageRow label="Outlets" used={counts.outlets} />
          <UsageRow label="QR codes" used={counts.campaigns} />
          <UsageRow label="Products" used={counts.products} />
          <UsageRow label="Team members" used={counts.teamMembers} />
        </div>
      </Card>

      <Card>
        <p className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>
            No payment provider is connected yet, so there is no invoice history or card on file to
            show. Plan limits are enforced against the usage above; billing for them is a later step.
            Nothing on this page is a placeholder figure.
          </span>
        </p>
      </Card>
    </div>
  )
}

function UsageRow({ label, used }: { label: string; used: number }) {
  return (
    <div className="rounded-2xl border border-line bg-raised px-4 py-3">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-0.5 font-display text-[20px] font-bold tracking-tight text-ink">
        {formatNumber(used)}
      </p>
    </div>
  )
}
