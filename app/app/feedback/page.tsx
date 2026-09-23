import type { Metadata } from 'next'
import { Feedback } from '@/views/app/Feedback'
import { FeedbackLive } from '@/views/app/FeedbackLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'
import type { FeedbackFilter, FeedbackItem } from '@/services/dashboard'

export const metadata: Metadata = { title: 'Feedback' }

type Params = ScopeParams & { max?: string; status?: string; cursor?: string }

/** Only the filters the UI offers; anything else falls back to showing everything. */
function filterFrom(params: Params): { key: string; filter: FeedbackFilter } {
  if (params.max === '3') return { key: 'needs-attention', filter: { maxRating: 3 } }
  if (params.status === 'new') {
    return { key: 'new', filter: { status: 'new' as FeedbackItem['status'] } }
  }
  return { key: 'all', filter: {} }
}

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await dashboardContext()

  if (context.mode !== 'live') return <Feedback />

  const params = await searchParams
  const scope = scopeFromParams(params)
  const { key, filter } = filterFrom(params)

  const page = await context.repo.feedback(scope, {
    ...filter,
    cursor: typeof params.cursor === 'string' ? params.cursor : null,
  })

  const baseQuery: Record<string, string> = {}
  if (scope.rangeKey !== '30d') baseQuery.range = scope.rangeKey
  if (scope.outletId) baseQuery.outlet = scope.outletId

  return (
    <FeedbackLive
      rangeLabel={scope.range.label}
      outletLabel={scope.outletId ? 'one outlet' : 'all outlets'}
      page={page}
      activeFilter={key}
      baseQuery={baseQuery}
    />
  )
}
