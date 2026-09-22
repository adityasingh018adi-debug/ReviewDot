'use client'

import { useMemo, useState } from 'react'
import { Download, Search, UserPlus, Users } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Stars } from '@/components/ui/Stars'
import { customers, outletById } from '@/lib/data'
import { entriesIn } from '@/lib/metrics'
import { useDataSet, useScope } from '@/store/app'
import { downloadCSV } from '@/lib/export'
import { average, formatNumber, formatPercent, relativeTime } from '@/lib/utils'

export function Customers() {
  const scope = useScope()
  const data = useDataSet()
  const [query, setQuery] = useState('')

  const entries = useMemo(() => entriesIn(scope, data), [scope, data])

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return customers
      .map((customer) => {
        const own = entries.filter((entry) => entry.customerId === customer.id)
        return {
          ...customer,
          periodReviews: own.length,
          periodRating: own.length ? average(own.map((entry) => entry.rating)) : customer.avgRating,
          lastEntry: own[0]?.createdAt ?? customer.lastSeen,
        }
      })
      .filter((customer) => customer.periodReviews > 0)
      .filter((customer) => `${customer.name} ${customer.contact}`.toLowerCase().includes(needle))
      .sort((a, b) => b.periodReviews - a.periodReviews || b.visits - a.visits)
  }, [entries, query])

  const returning = rows.filter((row) => row.visits > 1).length
  const identified = entries.filter((entry) => entry.customerId).length

  return (
    <div>
      <PageHeader
        title="Customers"
        description="People who left feedback in this period. Contact details are only captured when a customer chooses to share them."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCSV(
                rows.map((row) => ({
                  name: row.name,
                  contact: row.contact,
                  outlet: outletById(row.outletId)?.name ?? '',
                  visits: row.visits,
                  reviews_this_period: row.periodReviews,
                  avg_rating: row.periodRating.toFixed(2),
                  last_seen: row.lastEntry,
                })),
                'reviewdot-customers.csv',
              )
            }
          >
            <Download size={15} /> Export CSV
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Identified customers', value: formatNumber(rows.length), icon: Users },
          { label: 'Returning', value: formatNumber(returning), icon: UserPlus },
          {
            label: 'Reviews with a customer attached',
            value: formatPercent(entries.length ? identified / entries.length : 0, 0),
            icon: Users,
          },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-2xl bg-raised text-muted">
              <item.icon size={17} />
            </span>
            <div>
              <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-ink">
                {item.value}
              </p>
              <p className="mt-1 text-[12px] text-muted">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-line p-5">
          <CardHeader
            title="Customer list"
            subtitle={`${rows.length} people left feedback in ${scope.range.label.toLowerCase()}`}
            className="mb-4"
          />
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <Input
              className="pl-9"
              placeholder="Search name or contact…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search customers"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Outlet</th>
                <th className="px-3 py-3 text-right font-medium">Visits</th>
                <th className="px-3 py-3 text-right font-medium">Reviews</th>
                <th className="px-3 py-3 text-right font-medium">Avg rating</th>
                <th className="px-5 py-3 text-right font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0 hover:bg-raised">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                        {row.initials}
                      </span>
                      <span>
                        <span className="block text-[14px] font-medium text-ink">{row.name}</span>
                        <span className="block text-[12px] text-muted">{row.contact}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-[13px] text-muted">{outletById(row.outletId)?.name}</td>
                  <td className="px-3 py-3.5 text-right">
                    <Badge tone={row.visits > 1 ? 'positive' : 'neutral'}>{row.visits}</Badge>
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-ink-soft">
                    {row.periodReviews}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center justify-end gap-2">
                      <Stars value={row.periodRating} size={12} />
                      <span className="text-[14px] tabular-nums text-ink">{row.periodRating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[13px] text-muted">{relativeTime(row.lastEntry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
