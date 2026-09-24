import type { Metadata } from 'next'
import { Channels } from '@/views/app/Channels'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Channels' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  const scope = scopeFromParams(await searchParams)

  const [channels, outlets] = await Promise.all([
    context.repo.channels(scope),
    context.repo.outletsDetail(scope),
  ])

  return <Channels channels={channels} outlets={outlets} rangeLabel={scope.range.label} />
}
