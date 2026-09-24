import type { Metadata } from 'next'
import { InboxLive } from '@/views/app/InboxLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Reviews' }

type Params = ScopeParams & { cursor?: string; channel?: string }

/** Only the channels the product actually supports; anything else shows all. */
const CHANNELS = ['google', 'zomato', 'swiggy', 'instagram']

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await dashboardContext()
  const params = await searchParams
  const scope = scopeFromParams(params)
  const channel = CHANNELS.includes(params.channel ?? '') ? params.channel : undefined

  // Tab counts come from the channel aggregate rather than from the page of
  // rows, so a tab says how many there are and not how many were fetched.
  const [page, channels] = await Promise.all([
    context.repo.reviews(scope, {
      destination: channel,
      cursor: typeof params.cursor === 'string' ? params.cursor : null,
    }),
    context.repo.channels(scope),
  ])

  const baseQuery: Record<string, string> = {}
  if (scope.rangeKey !== '30d') baseQuery.range = scope.rangeKey
  if (scope.outletId) baseQuery.outlet = scope.outletId

  return (
    <InboxLive
      rangeLabel={scope.range.label}
      outletLabel={scope.outletId ? 'one outlet' : 'all outlets'}
      page={page}
      channels={channels}
      activeChannel={channel ?? 'all'}
      baseQuery={baseQuery}
    />
  )
}
