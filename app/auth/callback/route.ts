import { NextResponse, type NextRequest } from 'next/server'
import { serverClient } from '@/services/supabase.server'
import { isSupabaseConfigured } from '@/services/supabase'
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
  const next = safeNextPath(searchParams.get('next'))
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
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=link', origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
