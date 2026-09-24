import Link from 'next/link'
import { Info } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChannelCard } from '@/components/dashboard/ChannelCard'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils'
import type { ChannelRow, OutletDetail } from '@/services/dashboard'

/**
 * Review channels.
 *
 * The number on each card is click-throughs — customers this business sent to
 * that platform. It is deliberately not presented as that platform's review
 * count: none of them report back whether a review was actually posted, so a
 * figure labelled "2,846 reviews on Google" would be one we invented about
 * somebody else's business. The note on this page says so in the product, not
 * only in the code.
 */
export function Channels({
  channels,
  outlets,
  rangeLabel,
}: {
  channels: ChannelRow[]
  outlets: OutletDetail[]
  rangeLabel: string
}) {
  const total = channels.reduce((sum, channel) => sum + channel.clicks, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channels"
        description={`Where your customers are sent after they rate you · ${rangeLabel}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {channels.map((channel) => (
          <ChannelCard key={channel.channel} row={channel} />
        ))}
      </div>

      <Card>
        <p className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>
            These are <strong className="font-semibold text-ink">click-throughs</strong>:{' '}
            {formatNumber(total)} customers opened one of these platforms from a ReviewDot prompt in
            this period. None of these platforms tell us whether a review was then posted, so this
            page will never claim to know their review counts — only how many people you sent.
          </span>
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Destinations by outlet"
          subtitle="An outlet with no destination sends nobody anywhere"
          action={
            <Link href="/app/outlets" className="text-[12px] font-medium text-accent hover:underline">
              Manage outlets
            </Link>
          }
        />
        {outlets.length ? (
          <div className="space-y-2.5">
            {outlets.map((outlet) => (
              <div
                key={outlet.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{outlet.name}</p>
                  <p className="truncate text-[12px] text-faint">
                    {outlet.city ?? 'No city set'} · {formatNumber(outlet.scans)} scans
                  </p>
                </div>
                {outlet.googleReviewUrl ? (
                  <Badge tone="positive">Google</Badge>
                ) : (
                  <Badge tone="neutral">No destination</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">No outlets yet.</p>
        )}
      </Card>
    </div>
  )
}
