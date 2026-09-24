import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveMode } from '@/lib/app-mode'
import { isProtectedPath, isSignedOutOnlyPath } from '@/lib/routes'
import { classifyAuth } from '@/lib/auth-outcome'
import { sessionCookieDomain } from '@/lib/cookie-domain'

/**
 * The authentication gate.
 *
 * Two jobs, in order:
 *
 *   1. Refresh the Supabase session on every request, so server components and
 *      server actions see a token that has not expired.
 *   2. Decide whether this request may reach the dashboard at all.
 *
 * The decision is made here rather than in each layout because a layout that
 * forgets the check fails open, and there is no way to notice. A middleware that
 * forgets a path fails closed: the path simply is not reachable.
 *
 * Note that `/r/{code}` is deliberately public — customers scanning a QR code
 * have no account and must never be asked for one.
 */

function mode() {
  return resolveMode({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    demoFlag: process.env.NEXT_PUBLIC_DEMO_MODE || undefined,
  })
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const current = mode()

  // Without a database there is no session to refresh and no account to check.
  // Demo mode lets the dashboard through on seeded data; unconfigured lets the
  // route render its own "not configured" page rather than bouncing to a login
  // form that cannot work either.
  if (current !== 'live') return NextResponse.next()

  // One response object throughout: the Supabase client writes refreshed auth
  // cookies onto it, and returning a different one would drop them.
  let response = NextResponse.next({ request })

  /**
   * Redirect, carrying the refreshed session with it.
   *
   * getUser() does not just read the token, it renews it, and Supabase rotates
   * the refresh token when it does — the old one is spent the moment a new one
   * is issued. Those new cookies are written onto `response`. A bare
   * NextResponse.redirect() is a different response with no Set-Cookie on it,
   * so the browser never receives the replacement and keeps replaying a token
   * the auth server has already retired. The next refresh then fails and the
   * user is silently signed out — one request later, or an hour later, which is
   * why it looked intermittent.
   */
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url)
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    return redirect
  }

  const domain = sessionCookieDomain(request.headers.get('host'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Without this the cookie is host-only, so reviewdot.in and
      // www.reviewdot.in each hold their own half of one sign-in.
      ...(domain ? { cookieOptions: { domain } } : {}),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of list) response.cookies.set(name, value, options)
        },
      },
    },
  )

  // getUser() revalidates against the auth server; getSession() would trust a
  // cookie the client controls.
  const { data, error } = await supabase.auth.getUser()
  const outcome = classifyAuth(data.user, error)

  // Could not ask is not an answer about who this person is. The error used to
  // be destructured away, which made a timeout, a 5xx or a rate limit
  // indistinguishable from signing out — so a good session, one request after a
  // correct password, was sent back to the login form. Let the request through
  // instead: the page re-checks, and if the auth server is still unreachable it
  // renders an error the person can retry rather than a login form implying
  // they got their password wrong.
  if (outcome === 'unavailable') return response

  const user = outcome === 'authenticated' ? data.user : null

  if (isProtectedPath(pathname)) {
    if (!user) {
      /*
       * One line, in the deployment log, saying why.
       *
       * Everything about this redirect looks identical from the outside
       * whatever caused it — a real sign-out, a cookie the browser never sent
       * back, a token the auth server rejected. Names and counts only; no
       * token, no address, nothing about who this is.
       */
      console.log(
        JSON.stringify({
          level: 'info',
          scope: 'auth.redirect',
          to: '/login',
          from: pathname,
          host: request.headers.get('host'),
          proto: request.headers.get('x-forwarded-proto'),
          cookieDomain: domain ?? 'host-only',
          sessionCookies: request.cookies
            .getAll()
            .filter((cookie) => cookie.name.startsWith('sb-'))
            .map((cookie) => cookie.name),
          reason: error ? `${error.name}: ${error.message}` : 'no session in request',
        }),
      )

      const login = request.nextUrl.clone()
      login.pathname = '/login'
      login.search = ''
      // come back to where they were headed once they are signed in
      if (pathname !== '/app') login.searchParams.set('next', `${pathname}${search}`)
      return redirectTo(login)
    }
    return response
  }

  if (user && isSignedOutOnlyPath(pathname)) {
    const app = request.nextUrl.clone()
    app.pathname = '/app'
    app.search = ''
    return redirectTo(app)
  }

  return response
}

export const config = {
  /*
   * Only the paths where this middleware actually decides something: the gated
   * ones, and the three screens a signed-in user has no use for.
   *
   * It used to run on everything but static assets, on the reasoning that a
   * pass-through keeps sessions fresh. That reasoning had a cost nobody had
   * priced. getUser() does not merely read the token, it renews it when it has
   * expired, and Supabase rotates the refresh token when it does — the old one
   * is spent the moment a new one is issued. Running it on every request means
   * a page load, its prefetches and its API calls can all reach the expiry
   * window together, each presenting the same refresh token. One wins. The rest
   * are told the token was already used, and the adapter clears the session.
   * The user is signed out, at random, by their own page load.
   *
   * Nothing outside these paths needs it. The marketing pages never read a
   * session, /r/{code} is for customers who have no account, and the two API
   * routes that require a session call getWorkspaceSession() themselves rather
   * than trusting middleware — so narrowing this removes the races without
   * weakening a single check.
   *
   * The converse is just as load-bearing, and cost a session to learn: a path
   * whose server components *do* read a session has to be here even when it is
   * public, because a Server Component cannot write cookies and so cannot keep
   * the refreshed token it just paid for. It also takes a round trip to the auth server off
   * every scan, which is the one path a customer waits on.
   */
  matcher: [
    '/app/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    // Not gated — it refreshes here because a Server Component cannot. See
    // SESSION_READING in routes.ts.
    '/join/:path*',
  ],
}
