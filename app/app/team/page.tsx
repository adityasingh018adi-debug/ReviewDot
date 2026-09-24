import type { Metadata } from 'next'
import { Team } from '@/views/app/Team'
import { dashboardContext } from '@/services/dashboard-context.server'
import { getWorkspaceSession } from '@/services/auth.server'

export const metadata: Metadata = { title: 'Team' }

export default async function Page() {
  const context = await dashboardContext()

  const [team, invites, workspace] = await Promise.all([
    context.repo.team(),
    // invites_read already limits this to workspaces the caller administers, so
    // a staff member gets an empty list rather than an error.
    context.repo.invites(),
    context.mode === 'live' ? getWorkspaceSession() : null,
  ])

  return (
    <Team
      team={team}
      invites={invites}
      currentUserId={workspace?.user.id ?? 'demo-user'}
      canManageTeam={context.can('team:manage')}
    />
  )
}
