import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Settings } from '@/views/app/Settings'
import { SettingsLive } from '@/views/app/SettingsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { getWorkspaceSession } from '@/services/auth.server'

export const metadata: Metadata = { title: 'Settings' }

export default async function Page() {
  const context = await dashboardContext()
  if (!context) redirect('/login')
  if (context.mode !== 'live') return <Settings />

  const [organization, team, workspace] = await Promise.all([
    context.repo.organization(),
    context.repo.team(),
    getWorkspaceSession(),
  ])

  return (
    <SettingsLive
      organization={organization}
      team={team}
      currentUserId={workspace?.user.id ?? ''}
      canManageOrg={context.can('org:update')}
      canManageTeam={context.can('team:manage')}
    />
  )
}
