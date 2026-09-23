import type { Metadata } from 'next'
import { Insights } from '@/views/app/Insights'
import { InsightsLive } from '@/views/app/InsightsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'
import { insightsFrom } from '@/services/insights'

export const metadata: Metadata = { title: 'AI insights' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  if (context.mode !== 'live') return <Insights />

  const scope = scopeFromParams(await searchParams)
  const [stats, outlets, tags, products] = await Promise.all([
    context.repo.overview(scope),
    context.repo.outlets(scope),
    context.repo.tags(scope),
    context.repo.products(scope),
  ])

  const forward: Record<string, string> = {}
  if (scope.rangeKey !== '30d') forward.range = scope.rangeKey
  if (scope.outletId) forward.outlet = scope.outletId

  return (
    <InsightsLive
      cards={insightsFrom({ stats, outlets, tags, products })}
      rangeLabel={scope.range.label}
      outletLabel={
        scope.outletId
          ? (outlets.find((outlet) => outlet.id === scope.outletId)?.name ?? 'one outlet')
          : 'all outlets'
      }
      scope={forward}
    />
  )
}
