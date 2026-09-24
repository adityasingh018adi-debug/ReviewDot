import type { Metadata } from 'next'
import { Settings } from '@/views/app/Settings'
import { SettingsLive } from '@/views/app/SettingsLive'
import { dashboardContext } from '@/services/dashboard-context.server'

export const metadata: Metadata = { title: 'Settings' }

export default async function Page() {
  const context = await dashboardContext()
  if (context.mode !== 'live') return <Settings />

  const [organization, team] = await Promise.all([
    context.repo.organization(),
    context.repo.team(),
  ])

  return (
    <SettingsLive
      organization={organization}
      canManageOrg={context.can('org:update')}
      teamSize={team.length}
    />
  )
}
