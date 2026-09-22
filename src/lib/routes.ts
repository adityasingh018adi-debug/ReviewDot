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
