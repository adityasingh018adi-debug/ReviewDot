import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotConfigured } from '@/components/layout/NotConfigured'
import { initialsOf, type UiSession } from '@/components/layout/SessionProvider'
import { getWorkspaceSession } from '@/services/auth.server'
import { appMode } from '@/lib/app-mode'
import { business } from '@/lib/data'

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s · ReviewDot' },
  robots: { index: false, follow: false },
}

/**
 * Never prerendered.
 *
 * Two reasons, and both are load-bearing. It renders for whoever is signed in,
 * so a cached copy would be one tenant's dashboard served to another. And every
 * figure on it is relative to today, so HTML frozen at build time stops matching
 * what the browser computes the moment the date rolls over — React then throws
 * the whole server tree away and re-renders on the client, which is what was
 * wiping <html data-theme> and losing the user's dark mode on reload.
 */
export const dynamic = 'force-dynamic'

/**
 * The dashboard's own gate.
 *
 * Middleware already turns anonymous requests away, but this layout checks
 * again and resolves the session it renders from. That is not redundancy for
 * its own sake: middleware can be bypassed by a matcher change, and the
 * identity has to be read here anyway. Checking where the data is read is what
 * makes the two agree.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const mode = appMode()

  if (mode === 'unconfigured') return <NotConfigured />

  if (mode === 'demo') {
    const session: UiSession = {
      mode,
      user: {
        id: 'demo-user',
        email: 'ritika@loveandlatte.in',
        fullName: 'Ritika Shah',
        initials: 'RS',
      },
      organization: { id: business.id, name: business.name },
      role: 'OWNER',
      assignedOutletIds: [],
    }
    return <AppLayout session={session}>{children}</AppLayout>
  }

  const workspace = await getWorkspaceSession()
  if (!workspace) redirect('/login')

  // Signed in but with no organization yet — finish signing up first.
  if (!workspace.active) redirect('/onboarding')

  const fullName = workspace.user.fullName?.trim() || workspace.user.email
  const session: UiSession = {
    mode,
    user: {
      id: workspace.user.id,
      email: workspace.user.email,
      fullName,
      initials: initialsOf(fullName),
    },
    organization: {
      id: workspace.active.organizationId,
      name: workspace.active.organizationName,
    },
    role: workspace.active.role,
    assignedOutletIds: workspace.active.assignedOutletIds,
  }

  return <AppLayout session={session}>{children}</AppLayout>
}
