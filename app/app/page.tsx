import { DashboardLive } from '@/views/app/DashboardLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'
import { insightsFrom } from '@/services/insights'
import { getWorkspaceSession } from '@/services/auth.server'

/**
 * The Overview.
 *
 * Demo and live render the same view now. They differ only in which repository
 * answers — DemoDashboardRepo still computes from the seeded dataset through
 * metrics.ts, so the reference figures stay exact — and that is the point: one
 * design, and no second copy of the page to drift away from this one.
 */
export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  const scope = scopeFromParams(await searchParams)

  // Every one of these is an aggregate computed in the database. Nothing here
  // fetches rows in order to count them.
  const [stats, series, outlets, channels, products, counts, tags, recent, workspace] =
    await Promise.all([
      context.repo.overview(scope),
      context.repo.series(scope),
      context.repo.outlets(scope),
      context.repo.channels(scope),
      context.repo.products(scope),
      context.repo.counts(),
      context.repo.tags(scope),
      context.repo.feedback(scope, { limit: 4 }),
      context.mode === 'live' ? getWorkspaceSession() : null,
    ])

  // Computed, never generated. Each card states a figure that came out of the
  // database, and only appears when there is enough behind it to mean anything.
  const insights = insightsFrom({ stats, outlets, tags, products })

  const fullName = workspace?.user.fullName?.trim() || workspace?.user.email || 'there'
  const greetingName = fullName.split(/\s+/)[0] ?? 'there'

  return (
    <DashboardLive
      greetingName={context.mode === 'live' ? greetingName : 'Ritika'}
      organizationName={context.organizationName ?? 'Demo workspace'}
      rangeLabel={scope.range.label}
      stats={stats}
      series={series}
      outlets={outlets}
      channels={channels}
      products={products}
      counts={counts}
      insights={insights}
      recent={recent.items}
    />
  )
}
