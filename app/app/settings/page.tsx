import type { Metadata } from 'next'
import { Settings } from '@/views/app/Settings'
import { SettingsLive } from '@/views/app/SettingsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { getWorkspaceSession } from '@/services/auth.server'

export const metadata: Metadata = { title: 'Settings' }

export default async function Page() {
  const context = await dashboardContext()
  if (context.mode !== 'live') return <Settings />

  const [organization, team, invites, workspace] = await Promise.all([
    context.repo.organization(),
    context.repo.team(),
    // invites_read already limits this to workspaces the caller administers, so
    // a staff member gets an empty list rather than an error.
    context.repo.invites(),
    getWorkspaceSession(),
  ])

  return (
    <SettingsLive
      organization={organization}
      team={team}
      invites={invites}
      currentUserId={workspace?.user.id ?? ''}
      canManageOrg={context.can('org:update')}
      canManageTeam={context.can('team:manage')}
    />
  )
}
