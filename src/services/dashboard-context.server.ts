import { redirect } from 'next/navigation'
import { appMode, type AppMode } from '@/lib/app-mode'
import { getWorkspaceSession } from './auth.server'
import { DemoDashboardRepo } from './dashboard.demo'
import { SupabaseDashboardRepo } from './dashboard.server'
import type { DashboardRepo } from './dashboard'
import { can, type Permission, type Role } from '@/lib/permissions'

/**
 * Which dashboard a page is rendering, and where its numbers come from.
 *
 * One call so a page never has to ask about the mode itself, and so there is a
 * single place where "live" means "a signed-in member of a real organization,
 * reading through their own JWT".
 */

export type DashboardContext = {
  mode: AppMode
  repo: DashboardRepo
  /** Null in demo mode — there is no real organization behind it. */
  organizationId: string | null
  organizationName: string | null
  role: Role
  /**
   * Mirrors the policies so the UI does not offer something the database will
   * refuse. The database is still what enforces it — this only decides what to
   * render.
   */
  can: (permission: Permission) => boolean
}

/**
 * Resolves the dashboard for this request, or sends the caller where they
 * actually need to go. Never returns null.
 *
 * It used to return null for two unrelated situations — nobody signed in, and
 * signed in but not yet a member of any organization — and left each page to
 * decide what that meant. Every page guessed `/login`, which is right for the
 * first and wrong for the second: it bounces an authenticated user to the
 * sign-in screen, where middleware sees their valid session and sends them
 * straight back. The layout meanwhile redirects that same person to
 * `/onboarding`, and because a layout and its page render concurrently, which
 * answer won was a race. That is what made a working session look like it had
 * been lost, intermittently and only for some accounts.
 *
 * Deciding here means there is one answer rather than thirteen.
 */
export async function dashboardContext(): Promise<DashboardContext> {
  const mode = appMode()

  if (mode !== 'live') {
    return {
      mode,
      repo: new DemoDashboardRepo(),
      organizationId: null,
      organizationName: null,
      role: 'OWNER',
      can: () => true,
    }
  }

  const workspace = await getWorkspaceSession()

  // No session at all: sign in. This is the only route to /login from here.
  if (!workspace) redirect('/login')

  // Signed in, but with no organization yet — finish signing up. Sending this
  // person to /login would be telling them to do something they have done.
  if (!workspace.active) redirect('/onboarding')

  const role = workspace.active.role
  return {
    mode,
    repo: new SupabaseDashboardRepo(workspace.active.organizationId),
    organizationId: workspace.active.organizationId,
    organizationName: workspace.active.organizationName,
    role,
    can: (permission) => can(role, permission),
  }
}
