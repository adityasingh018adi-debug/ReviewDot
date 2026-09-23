'use client'

import { Megaphone, QrCode } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { QRPreview } from '@/components/qr/QRPreview'
import { campaigns } from '@/lib/data'
import { displayUrl, scanUrl } from '@/lib/links'
import { useQRCodes } from '@/store/app'
import { formatDate, formatNumber, formatPercent } from '@/lib/utils'

const STATUS_TONE = { live: 'positive', scheduled: 'info', ended: 'neutral' } as const

export function Campaigns() {
  const codes = useQRCodes()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Group QR codes behind a campaign to see what a flyer, story or packaging insert actually produced."
        action={
          <ButtonLink href="/app/campaigns" size="sm" variant="secondary">
            <QrCode size={15} /> Create campaign QR
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign) => {
          const code = codes.find((item) => campaign.qrIds.includes(item.id))
          const conversion = campaign.scans ? campaign.reviews / campaign.scans : 0
          return (
            <Card key={campaign.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-tight text-ink">{campaign.name}</h3>
                  <p className="mt-1 text-[13px] text-muted">{campaign.goal}</p>
                </div>
                <Badge tone={STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
              </div>

              <div className="mt-5 flex items-center gap-5">
                {code ? (
                  <div className="rounded-2xl border border-line p-2.5">
                    <QRPreview value={scanUrl(code.code)} size={78} />
                  </div>
                ) : (
                  <div className="grid size-[98px] place-items-center rounded-2xl border border-dashed border-line text-muted">
                    <Megaphone size={20} />
                  </div>
                )}
                <div className="grid flex-1 grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Scans', value: formatNumber(campaign.scans) },
                    { label: 'Reviews', value: formatNumber(campaign.reviews) },
                    { label: 'Conversion', value: formatPercent(conversion, 1) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-raised px-2 py-3">
                      <p className="font-display text-[17px] font-semibold tabular-nums text-ink">{item.value}</p>
                      <p className="mt-0.5 text-[11px] text-faint">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Channel</dt>
                  <dd className="text-ink-soft">{campaign.channel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{campaign.status === 'scheduled' ? 'Starts' : 'Started'}</dt>
                  <dd className="text-ink-soft">{formatDate(campaign.startedAt)}</dd>
                </div>
                {code ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Short link</dt>
                    <dd className="text-ink-soft">{displayUrl(code.code)}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader
          title="Lifetime campaign totals"
          subtitle="Campaign figures are cumulative and are not affected by the date range selector."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="py-2.5 font-medium">Campaign</th>
                <th className="py-2.5 font-medium">Channel</th>
                <th className="py-2.5 text-right font-medium">Scans</th>
                <th className="py-2.5 text-right font-medium">Reviews</th>
                <th className="py-2.5 text-right font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-line last:border-0">
                  <td className="py-3 text-[14px] font-medium text-ink">{campaign.name}</td>
                  <td className="py-3 text-[13px] text-muted">{campaign.channel}</td>
                  <td className="py-3 text-right text-[14px] tabular-nums text-ink-soft">
                    {formatNumber(campaign.scans)}
                  </td>
                  <td className="py-3 text-right text-[14px] tabular-nums text-ink-soft">
                    {formatNumber(campaign.reviews)}
                  </td>
                  <td className="py-3 text-right text-[14px] tabular-nums text-muted">
                    {formatPercent(campaign.scans ? campaign.reviews / campaign.scans : 0, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
