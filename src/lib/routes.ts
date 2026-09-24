/**
 * Which paths the authentication gate applies to.
 *
 * Kept here, pure and tested, rather than inline in middleware.ts: a mistake in
 * this matching is the difference between a protected dashboard and an open one,
 * and middleware itself is awkward to test directly.
 */

/** Requires a signed-in user. */
export const PROTECTED_PREFIXES = ['/app', '/onboarding'] as const

/** Pointless once signed in; we bounce the user to the dashboard instead. */
export const SIGNED_OUT_ONLY = ['/login', '/signup', '/forgot-password'] as const

/**
 * Public, but they read the session anyway — and that is why middleware has to
 * run on them.
 *
 * A Server Component cannot write cookies; Next refuses the write. So when one
 * reads a session whose access token has gone stale, Supabase renews it, retires
 * the old refresh token, and the replacement is thrown away on the way out. The
 * browser keeps replaying a token the auth server has already spent, and the
 * next request is signed out — permanently, until the cookie is replaced by
 * signing in again.
 *
 * Middleware is the one place in a request that can persist that renewal, so
 * every path that reads a session has to pass through it. These are not gated:
 * `/join/{token}` is for invitees who usually have no account at all. Middleware
 * only refreshes on the way past.
 */
export const SESSION_READING = ['/join'] as const

/**
 * Prefix match on whole segments only. `/app` and `/app/outlets` are protected;
 * `/apples` is not, which a naive startsWith('/app') would get wrong and quietly
 * gate a marketing page.
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function isSignedOutOnlyPath(pathname: string): boolean {
  return (SIGNED_OUT_ONLY as readonly string[]).includes(pathname)
}
