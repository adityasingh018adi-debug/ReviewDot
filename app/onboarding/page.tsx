import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Onboarding } from '@/views/app/Onboarding'
import { getWorkspaceSession } from '@/services/auth.server'
import { appMode } from '@/lib/app-mode'

/**
 * Lives outside /app so the dashboard layout — which redirects here when a user
 * has no organization — cannot redirect to itself.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Set up your workspace',
  robots: { index: false, follow: false },
}

export default async function Page() {
  // Demo mode has a workspace already; there is nothing to onboard.
  if (appMode() !== 'live') redirect('/app')

  const workspace = await getWorkspaceSession()
  if (!workspace) redirect('/login')
  if (workspace.active) redirect('/app')

  return <Onboarding />
}
