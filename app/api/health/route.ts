import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { appMode } from '@/lib/app-mode'
import { BUILD_LABEL } from '@/lib/build-info'

/**
 * What this deployment actually is, from the outside.
 *
 * Three questions kept coming back unanswerable from a chat window: is the new
 * code live, is it configured, and does the browser's session cookie survive
 * the trip. This answers all three in one GET.
 *
 * It reports no secret and nothing about anyone else: booleans for whether
 * variables are set (never their values), the host and protocol the caller's
 * own request arrived with, and the *names* of the Supabase cookies that
 * request carried. A caller learns only what they already sent.
 *
 * The cookie check is the pointed one. Supabase writes its session cookie with
 * no `domain`, so it is host-only: set on reviewdot.in, it is not sent to
 * www.reviewdot.in. A deployment that redirects between the two loses the
 * session on every sign-in, which looks exactly like a rejected password.
 * Compare `request.host` here against the host you signed in on.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const head = await headers()
  const store = await cookies()

  const set = (name: string) => Boolean(process.env[name]?.trim())

  return NextResponse.json(
    {
      build: BUILD_LABEL,
      mode: appMode(),
      env: {
        NEXT_PUBLIC_SUPABASE_URL: set('NEXT_PUBLIC_SUPABASE_URL'),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: set('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        SUPABASE_SERVICE_ROLE_KEY: set('SUPABASE_SERVICE_ROLE_KEY'),
        ANTHROPIC_API_KEY: set('ANTHROPIC_API_KEY'),
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
        VISITOR_SALT: set('VISITOR_SALT'),
      },
      request: {
        host: head.get('host'),
        forwardedHost: head.get('x-forwarded-host'),
        forwardedProto: head.get('x-forwarded-proto'),
      },
      // names only — never values
      authCookies: store
        .getAll()
        .map((cookie) => cookie.name)
        .filter((name) => name.startsWith('sb-')),
      checkedAt: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
