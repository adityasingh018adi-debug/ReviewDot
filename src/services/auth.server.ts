import { cookies } from 'next/headers'
import { serverClient } from './supabase.server'
import { isSupabaseConfigured } from './supabase'
import type { AuthService, Membership, SessionUser } from './types'
import type { Role } from '@/lib/permissions'
import { AuthUnavailableError, classifyAuth } from '@/lib/auth-outcome'

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

/**
 * Which workspace the dashboard is showing, when someone belongs to more than
 * one.
 *
 * Someone who signs up and is then invited elsewhere belongs to two: their own
 * and the one they were invited to. Picking memberships[0] always landed them
 * in the older of the two — their own empty workspace — with no way out, which
 * made an invitation useless even once it could be sent.
 *
 * The choice is a cookie rather than a column because it is a per-browser
 * preference, not a fact about the account. A value naming an organization the
 * caller is not a member of is ignored rather than trusted: the list it is
 * matched against already came back through row level security.
 */
export const ACTIVE_ORG_COOKIE = 'reviewdot-org'

export class SupabaseAuthService implements AuthService {
  async getUser(): Promise<SessionUser | null> {
    if (!isSupabaseConfigured()) return null
    const supabase = await serverClient()

    // getUser() revalidates the JWT with the auth server. getSession() only
    // decodes the cookie, which a client could have written — never authorize
    // on it.
    const { data, error } = await supabase.auth.getUser()
    const outcome = classifyAuth(data.user, error)

    // Null means "signed out", and callers act on it by sending the person to
    // the login page. It must therefore never mean "the auth server did not
    // answer": that is how a valid session ends up staring at a login form.
    // Raise instead, so the failure is visible and recoverable.
    if (outcome === 'unavailable') throw new AuthUnavailableError()
    if (outcome === 'signed-out' || !data.user) return null

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

    // A failed read is not the same fact as "belongs to nothing", and flattening
    // the two is how a network blip became a sign-out: no memberships means no
    // active organization, which sends a perfectly valid session off to
    // onboarding to create a business it already has. Let it throw — an error
    // boundary is a true statement, an empty list is not.
    if (error) throw error
    if (!data) return []

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

  const store = await cookies()
  const preferred = store.get(ACTIVE_ORG_COOKIE)?.value
  const active =
    memberships.find((membership) => membership.organizationId === preferred) ??
    memberships[0] ??
    null

  return { user, memberships, active }
}
