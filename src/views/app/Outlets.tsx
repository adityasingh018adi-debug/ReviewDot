'use client'

import { useMemo } from 'react'
import { Building2, MapPin, QrCode, User } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { BarChart } from '@/components/charts/BarChart'
import { Stars } from '@/components/ui/Stars'
import { outlets } from '@/lib/data'
import { byOutlet } from '@/lib/metrics'
import { useApp, useDataSet, useQRCodes, useScope } from '@/store/app'
import { formatNumber, formatPercent } from '@/lib/utils'

export function Outlets() {
  const scope = useScope()
  const data = useDataSet()
  const codes = useQRCodes()
  const setOutlet = useApp((s) => s.setOutlet)
  const rows = useMemo(() => byOutlet({ ...scope, outletId: 'all' }, data), [scope, data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outlets"
        description={`${outlets.length} outlets · ${scope.range.label.toLowerCase()}`}
        action={
          <Button size="sm" variant="secondary" onClick={() => setOutlet('all')}>
            View all outlets
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((row) => {
          const outlet = outlets.find((item) => item.id === row.id)!
          const outletCodes = codes.filter((code) => code.outletId === row.id)
          return (
            <Card key={row.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-tight text-ink">{outlet.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                    <MapPin size={12} /> {outlet.city}
                  </p>
                </div>
                <Badge tone={row.rating >= 4.6 ? 'positive' : 'warning'}>{row.rating.toFixed(1)} ★</Badge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Scans', value: formatNumber(row.scans) },
                  { label: 'Reviews', value: formatNumber(row.reviews) },
                  { label: 'Conversion', value: formatPercent(row.conversion, 1) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-raised px-2 py-3">
                    <p className="font-display text-[17px] font-semibold tabular-nums text-ink">{item.value}</p>
                    <p className="mt-0.5 text-[11px] text-faint">{item.label}</p>
                  </div>
                ))}
              </div>

              <dl className="mt-5 space-y-2 text-[13px]">
                <div className="flex items-center gap-2 text-muted">
                  <User size={13} /> <dt className="sr-only">Manager</dt>
                  <dd className="text-ink-soft">{outlet.manager}</dd>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <QrCode size={13} /> <dt className="sr-only">QR codes</dt>
                  <dd className="text-ink-soft">
                    {outletCodes.length} codes · {outletCodes.filter((code) => code.status === 'active').length} active
                  </dd>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Building2 size={13} /> <dt className="sr-only">Address</dt>
                  <dd className="text-ink-soft">{outlet.address}</dd>
                </div>
              </dl>

              <Button
                variant="secondary"
                size="sm"
                className="mt-5 w-full"
                onClick={() => setOutlet(row.id)}
              >
                Filter workspace to {outlet.name}
              </Button>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader title="Reviews by outlet" subtitle="Volume collected this period" />
        <BarChart
          data={rows.map((row) => ({
            label: row.name,
            value: row.reviews,
            hint: `${formatPercent(row.conversion, 1)} of scans converted`,
          }))}
          caption="Reviews by outlet"
        />
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-5 py-3 font-medium">Outlet</th>
                <th className="px-3 py-3 text-right font-medium">Scans</th>
                <th className="px-3 py-3 text-right font-medium">Reviews</th>
                <th className="px-3 py-3 text-right font-medium">Conversion</th>
                <th className="px-3 py-3 text-right font-medium">Private feedback</th>
                <th className="px-5 py-3 text-right font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0 hover:bg-raised">
                  <td className="px-5 py-3.5 text-[14px] font-medium text-ink">{row.name}</td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-ink-soft">
                    {formatNumber(row.scans)}
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-ink-soft">
                    {formatNumber(row.reviews)}
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-ink-soft">
                    {formatPercent(row.conversion, 1)}
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-muted">{row.feedback}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center justify-end gap-2">
                      <Stars value={row.rating} size={12} />
                      <span className="text-[14px] font-medium tabular-nums text-ink">{row.rating.toFixed(1)}</span>
                    </span>
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
