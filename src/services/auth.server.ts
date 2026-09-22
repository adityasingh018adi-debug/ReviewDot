import { serverClient } from './supabase.server'
import { isSupabaseConfigured } from './supabase'
import type { AuthService, Membership, SessionUser } from './types'
import type { Role } from '@/lib/permissions'

/**
 * Identity, server side.
 *
 * Reads through serverClient(), so every query carries the caller's JWT and row
 * level security decides what comes back. `getMemberships()` does not filter by
 * user id in its `where` clause on purpose: `members_read` already restricts the
 * rows to organizations the caller belongs to, and letting the database do it
 * means a mistake here cannot widen access.
 */

export type WorkspaceSession = {
  user: SessionUser
  memberships: Membership[]
  /** The membership the dashboard is currently acting through. */
  active: Membership | null
}

export class SupabaseAuthService implements AuthService {
  async getUser(): Promise<SessionUser | null> {
    if (!isSupabaseConfigured()) return null
    const supabase = await serverClient()

    // getUser() revalidates the JWT with the auth server. getSession() only
    // decodes the cookie, which a client could have written — never authorize
    // on it.
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, is_platform_admin')
      .eq('id', data.user.id)
      .maybeSingle()

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName: profile?.full_name ?? undefined,
      isPlatformAdmin: Boolean(profile?.is_platform_admin),
    }
  }

  async getMemberships(userId: string): Promise<Membership[]> {
    if (!isSupabaseConfigured()) return []
    const supabase = await serverClient()

    const { data, error } = await supabase
      .from('organization_members')
      .select('id, organization_id, role, organizations!inner (id, name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error || !data) return []

    const memberIds = data.map((row) => row.id as string)
    const assignments = memberIds.length
      ? ((
          await supabase
            .from('team_assignments')
            .select('member_id, outlet_id')
            .in('member_id', memberIds)
        ).data ?? [])
      : []

    return data.map((row) => {
      const org = row.organizations as unknown as { id: string; name: string }
      return {
        organizationId: org.id,
        organizationName: org.name,
        role: row.role as Role,
        assignedOutletIds: assignments
          .filter((a) => a.member_id === row.id)
          .map((a) => a.outlet_id as string),
      }
    })
  }
}

/**
 * The whole signed-in context in one call, for layouts and server components.
 * Returns null when nobody is signed in — callers redirect, they never assume.
 */
export async function getWorkspaceSession(): Promise<WorkspaceSession | null> {
  const auth = new SupabaseAuthService()
  const user = await auth.getUser()
  if (!user) return null

  const memberships = await auth.getMemberships(user.id)
  return { user, memberships, active: memberships[0] ?? null }
}
