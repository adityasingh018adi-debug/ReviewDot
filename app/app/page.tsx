import { redirect } from 'next/navigation'
import { Dashboard } from '@/views/app/Dashboard'
import { DashboardLive } from '@/views/app/DashboardLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  if (!context) redirect('/login')

  // Demo mode keeps the seeded view, which reproduces the product's reference
  // figures exactly. It goes away once every panel opposite is backed by a query.
  if (context.mode !== 'live') return <Dashboard />

  const scope = scopeFromParams(await searchParams)

  // Five reads, one round trip's worth of latency. Each one is an aggregate
  // computed in Postgres — nothing here fetches rows in order to count them.
  const [stats, series, outlets, distribution, recent] = await Promise.all([
    context.repo.overview(scope),
    context.repo.series(scope),
    context.repo.outlets(scope),
    context.repo.ratingDistribution(scope),
    context.repo.feedback(scope, { limit: 5 }),
  ])

  const outletLabel = scope.outletId
    ? (outlets.find((outlet) => outlet.id === scope.outletId)?.name ?? 'one outlet')
    : 'all outlets'

  return (
    <DashboardLive
      organizationName={context.organizationName ?? 'Your workspace'}
      rangeLabel={scope.range.label}
      outletLabel={outletLabel}
      stats={stats}
      series={series}
      outlets={outlets}
      distribution={distribution}
      recent={recent.items}
    />
  )
}
