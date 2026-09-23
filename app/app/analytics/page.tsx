import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Analytics } from '@/views/app/Analytics'
import { AnalyticsLive } from '@/views/app/AnalyticsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Analytics' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  if (!context) redirect('/login')
  if (context.mode !== 'live') return <Analytics />

  const scope = scopeFromParams(await searchParams)
  const [series, funnel, tags, outlets, distribution] = await Promise.all([
    context.repo.series(scope),
    context.repo.funnel(scope),
    context.repo.tags(scope),
    context.repo.outlets(scope),
    context.repo.ratingDistribution(scope),
  ])

  return (
    <AnalyticsLive
      rangeLabel={scope.range.label}
      outletLabel={scope.outletId ? 'one outlet' : 'all outlets'}
      series={series}
      funnel={funnel}
      tags={tags}
      outlets={outlets}
      distribution={distribution}
    />
  )
}
