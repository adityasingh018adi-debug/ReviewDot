import { NextResponse, type NextRequest } from 'next/server'
import { serverClient } from '@/services/supabase.server'
import { isSupabaseConfigured } from '@/services/supabase'
import { SupabaseAuthService } from '@/services/auth.server'
import { safeNextPath } from '@/lib/site-url'

/**
 * Where Supabase sends the browser back to after an email confirmation, a
 * password reset link, or a Google sign-in. Exchanges the one-time code for a
 * session cookie and forwards the user on.
 *
 * `next` comes from the query string, so it is sanitised before use — otherwise
 * this route would be an open redirect wearing an authentication badge.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  // Empty rather than '/app', so a round trip with no destination of its own
  // can be decided from what the account actually has.
  const next = safeNextPath(searchParams.get('next'), '')
  const code = searchParams.get('code')

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=unavailable', origin))
  }

  // Supabase reports a refused or expired link here rather than by failing the
  // exchange, so check before spending the code.
  if (searchParams.get('error')) {
    return NextResponse.redirect(new URL('/login?error=link', origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=link', origin))
  }

  const supabase = await serverClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=link', origin))
  }

  return NextResponse.redirect(new URL(await destination(next, data.session?.user.id), origin))
}

/**
 * Where the round trip ends.
 *
 * Same rule as signInAction: an explicit destination wins, because somebody
 * arriving from an invitation has no workspace of their own and onboarding
 * would have them create a second business rather than join the one that asked
 * for them. With nothing explicit, decide from membership, so a first sign-in
 * goes to onboarding directly instead of bouncing off the dashboard.
 */
async function destination(explicit: string, userId: string | undefined): Promise<string> {
  if (explicit) return explicit
  if (!userId) return '/app'

  // As in signInAction: a failed read is not an answer about membership, and
  // `/app` re-resolves it behind a layout that can retry.
  const memberships = await new SupabaseAuthService().getMemberships(userId).catch(() => null)
  if (!memberships) return '/app'

  return memberships.length ? '/app' : '/onboarding'
}
