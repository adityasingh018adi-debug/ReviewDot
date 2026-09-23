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

export async function dashboardContext(): Promise<DashboardContext | null> {
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
  // The layout already redirects when either of these is missing; returning
  // null rather than guessing keeps that decision in one place.
  if (!workspace?.active) return null

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
