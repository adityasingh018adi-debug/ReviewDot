import type { Metadata } from 'next'
import { CampaignsLive } from '@/views/app/CampaignsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'QR campaigns' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  const scope = scopeFromParams(await searchParams)
  const [campaigns, outlets] = await Promise.all([
    context.repo.campaigns(scope),
    context.repo.outletOptions(),
  ])

  return (
    <CampaignsLive
      campaigns={campaigns}
      outlets={outlets}
      canManage={context.can('campaign:create')}
    />
  )
}
