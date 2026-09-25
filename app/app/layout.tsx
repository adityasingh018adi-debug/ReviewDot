import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadFailed } from '@/components/layout/LoadFailed'
import { NotConfigured } from '@/components/layout/NotConfigured'
import { initialsOf } from '@/components/layout/initials'
import type { UiSession } from '@/components/layout/SessionProvider'
import { getWorkspaceSession } from '@/services/auth.server'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams } from '@/services/scope'
import { appMode } from '@/lib/app-mode'
import { AuthUnavailableError } from '@/lib/auth-outcome'
import { business } from '@/lib/data'
import { DemoDashboardRepo } from '@/services/dashboard.demo'

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
      organizations: [{ id: business.id, name: business.name }],
      role: 'OWNER',
      assignedOutletIds: [],
      outlets: [],
    }
    const demoCount = await new DemoDashboardRepo()
      .feedbackStatusCounts(scopeFromParams({}))
      .then((counts) => counts.new)
      .catch(() => 0)
    return (
      <AppLayout session={session} unreviewed={demoCount}>
        {children}
      </AppLayout>
    )
  }

  // The session read is the one thing this layout does that can fail for a
  // reason that is not the person's. Next's error boundaries live *inside*
  // their segment's layout, so `app/app/error.tsx` never sees this one —
  // handling it here is what stops "could not reach the auth server" from
  // falling through to the generic error page.
  let workspace: Awaited<ReturnType<typeof getWorkspaceSession>>
  try {
    workspace = await getWorkspaceSession()
  } catch (error) {
    if (error instanceof AuthUnavailableError) return <LoadFailed standalone />
    throw error
  }

  if (!workspace) redirect('/login')

  // Signed in but with no organization yet — finish signing up first.
  if (!workspace.active) redirect('/onboarding')

  // The outlet picker needs real outlets, and only the ones this member can see
  // — which is app_can_see_outlet's job, not the picker's.
  const context = await dashboardContext()
  const outlets = await context.repo.outletOptions().catch(() => [])

  /*
   * Feedback nobody has looked at yet, counted here so the number is on screen
   * without anyone opening the page to discover it. A complaint sitting unread
   * is the one thing on this dashboard with a clock on it.
   *
   * Scoped to the default window, like every other figure the dashboard opens
   * with, and failing to zero: a badge is a prompt, not a fact worth breaking
   * the whole layout over.
   */
  const unreviewed = await context.repo
    .feedbackStatusCounts(scopeFromParams({}))
    .then((counts) => counts.new)
    .catch(() => 0)

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
    organizations: workspace.memberships.map((membership) => ({
      id: membership.organizationId,
      name: membership.organizationName,
    })),
    role: workspace.active.role,
    assignedOutletIds: workspace.active.assignedOutletIds,
    outlets,
  }

  return (
    <AppLayout session={session} unreviewed={unreviewed}>
      {children}
    </AppLayout>
  )
}
