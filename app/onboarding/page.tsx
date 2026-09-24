import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Onboarding } from '@/views/app/Onboarding'
import { getWorkspaceSession } from '@/services/auth.server'
import { LoadFailed } from '@/components/layout/LoadFailed'
import { appMode } from '@/lib/app-mode'
import { AuthUnavailableError } from '@/lib/auth-outcome'

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

  // Caught here rather than left to `error.tsx`: when a Server Component
  // throws while producing the first HTML there is no Suspense boundary for
  // React to recover into, so the request ends as a 500 and the boundary only
  // ever runs on a client navigation. Handling it in the page is what makes
  // the retry screen the thing people actually see.
  let workspace: Awaited<ReturnType<typeof getWorkspaceSession>>
  try {
    workspace = await getWorkspaceSession()
  } catch (error) {
    if (error instanceof AuthUnavailableError) {
      return <LoadFailed standalone title="We couldn’t reach your account" />
    }
    throw error
  }

  if (!workspace) redirect('/login')
  if (workspace.active) redirect('/app')

  return <Onboarding />
}
