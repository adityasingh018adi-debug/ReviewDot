import { describe, expect, it } from 'vitest'
import { config } from '../../middleware'
import { PROTECTED_PREFIXES, SIGNED_OUT_ONLY, isProtectedPath, isSignedOutOnlyPath } from './routes'

/**
 * The matcher and the rules have to agree.
 *
 * Middleware only runs on the paths its matcher names. A rule added to
 * routes.ts without a matching entry here is a rule that never executes — the
 * gate looks right in the file and does nothing on the request. The layout
 * checks again and would still turn an anonymous visitor away, so this is not
 * the only thing standing between a stranger and the dashboard, but a gate that
 * silently stops running is worth failing a test over.
 */

/** Next's matcher syntax, reduced to what this project actually uses. */
function matches(pattern: string, pathname: string): boolean {
  const regex = new RegExp(
    '^' + pattern.replace(/\/:[A-Za-z]+\*/g, '(?:/.*)?').replace(/\//g, '\\/') + '$',
  )
  return regex.test(pathname)
}

const covered = (pathname: string) => config.matcher.some((p) => matches(p, pathname))

describe('the middleware matcher', () => {
  it('covers every path the gate is supposed to protect', () => {
    for (const prefix of PROTECTED_PREFIXES) {
      expect(isProtectedPath(prefix), prefix).toBe(true)
      expect(covered(prefix), `${prefix} is protected but middleware never runs on it`).toBe(true)
      expect(covered(`${prefix}/deeper/still`), `${prefix}/*`).toBe(true)
    }
  })

  it('covers every screen a signed-in user is bounced off', () => {
    for (const path of SIGNED_OUT_ONLY) {
      expect(isSignedOutOnlyPath(path), path).toBe(true)
      expect(covered(path), `${path} bounces signed-in users but middleware never runs on it`).toBe(
        true,
      )
    }
  })

  it('does not run where it would only spend a refresh token', () => {
    // Each of these either has no session to refresh or authorises itself, and
    // every extra pass through getUser() is another racer for the one refresh
    // token when it expires.
    for (const path of [
      '/',
      '/pricing',
      '/product',
      '/r/2f6c8a1b',
      '/join/2f6c8a1b',
      '/auth/callback',
      '/api/ai/review',
      '/api/ai/assistant',
      '/reset-password',
    ]) {
      expect(covered(path), `${path} should not go through middleware`).toBe(false)
    }
  })
})
