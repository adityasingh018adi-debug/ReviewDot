import type { Metadata } from 'next'
import { Reviews } from '@/views/app/Reviews'
import { InboxLive } from '@/views/app/InboxLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Review inbox' }

type Params = ScopeParams & { cursor?: string }

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await dashboardContext()
  if (context.mode !== 'live') return <Reviews />

  const params = await searchParams
  const scope = scopeFromParams(params)
  const page = await context.repo.reviews(scope, {
    cursor: typeof params.cursor === 'string' ? params.cursor : null,
  })

  const baseQuery: Record<string, string> = {}
  if (scope.rangeKey !== '30d') baseQuery.range = scope.rangeKey
  if (scope.outletId) baseQuery.outlet = scope.outletId

  return (
    <InboxLive
      rangeLabel={scope.range.label}
      outletLabel={scope.outletId ? 'one outlet' : 'all outlets'}
      page={page}
      baseQuery={baseQuery}
    />
  )
}
