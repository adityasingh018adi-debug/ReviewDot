import type { Metadata } from 'next'
import { OutletsLive } from '@/views/app/OutletsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Outlets' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  const scope = scopeFromParams(await searchParams)
  const outlets = await context.repo.outletsDetail(scope)

  return <OutletsLive outlets={outlets} canManage={context.can('outlet:create')} />
}
