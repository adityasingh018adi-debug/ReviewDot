import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveMode } from '@/lib/app-mode'
import { isProtectedPath, isSignedOutOnlyPath } from '@/lib/routes'

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedPath(pathname)) {
    if (!user) {
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
  matcher: [
    /*
     * Everything except static assets and image files. The scan page, the
     * marketing site and the AI routes all pass through so their sessions stay
     * fresh; only the rules above actually block anything.
     */
    '/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
}
