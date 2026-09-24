import type { Metadata } from 'next'
import { CustomersLive } from '@/views/app/CustomersLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Customers' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  const scope = scopeFromParams(await searchParams)
  const customers = await context.repo.customers(scope)

  return (
    <CustomersLive
      rangeLabel={scope.range.label}
      outletLabel={scope.outletId ? 'one outlet' : 'all outlets'}
      customers={customers}
    />
  )
}
