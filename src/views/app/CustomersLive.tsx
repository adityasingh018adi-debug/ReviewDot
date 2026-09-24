'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Empty } from '@/components/ui/Empty'
import { formatNumber } from '@/lib/utils'
import type { CustomerRow } from '@/services/dashboard'
import { OutletPicker } from '@/components/layout/ScopePickers'

/**
 * Customers who left a way to be reached.
 *
 * Only those who volunteered contact details appear, and anyone whose details
 * have been erased drops out — app_erase_feedback_contact() stamps
 * contact_erased_at, and someone who asked to be forgotten should not resurface
 * in a list a week later.
 */
export function CustomersLive({
  rangeLabel,
  outletLabel,
  customers,
}: {
  rangeLabel: string
  outletLabel: string
  customers: CustomerRow[]
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${rangeLabel} · ${outletLabel}`}
        action={<OutletPicker />}
      />

      <Card>
        <CardHeader
          title="People who left their details"
          subtitle={`${formatNumber(customers.length)} in this period`}
        />

        {customers.length ? (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-2 py-2.5 font-medium">Customer</th>
                  <th className="px-2 py-2.5 text-right font-medium">Visits</th>
                  <th className="px-2 py-2.5 text-right font-medium">Avg rating</th>
                  <th className="px-2 py-2.5 text-right font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.contact} className="border-b border-line last:border-0">
                    <td className="px-2 py-3">
                      <p className="text-[14px] font-medium text-ink">{customer.name ?? 'Anonymous'}</p>
                      <p className="text-[12px] text-muted">{customer.contact}</p>
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-ink-soft">
                      {customer.visits}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] font-medium tabular-nums text-ink">
                      {customer.avgRating === null ? '—' : `${customer.avgRating.toFixed(1)}★`}
                    </td>
                    <td className="px-2 py-3 text-right text-[13px] tabular-nums text-muted">
                      {new Date(customer.lastSeen).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No contact details yet"
            detail="Customers only appear here when they choose to leave a name, email or phone number with their feedback."
          />
        )}
      </Card>
    </div>
  )
}
