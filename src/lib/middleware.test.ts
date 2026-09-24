import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The authentication gate, exercised directly.
 *
 * What is being pinned here is not "does it redirect" — routes.test.ts already
 * covers the path rules — but whether the refreshed session survives the
 * redirect. Supabase rotates the refresh token on every refresh: the old one is
 * spent the moment a new one is issued. If the response that carries the new
 * one back to the browser is thrown away, the browser keeps replaying a token
 * the auth server has already retired, and the next refresh signs the user out.
 * Nothing in the app notices, because from its side the cookie simply stopped
 * working.
 */

const ROTATED = [
  { name: 'sb-access-token', value: 'new-access', options: { path: '/' } },
  { name: 'sb-refresh-token', value: 'new-refresh', options: { path: '/' } },
]

/** A Supabase client whose getUser() refreshes, as the real one does. */
let signedIn = true
/** Set to simulate the auth server failing rather than answering. */
let authError: { name: string; status?: number } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (l: unknown[]) => void } }) => ({
    auth: {
      getUser: async () => {
        // the refresh writes rotated cookies through the adapter
        options.cookies.setAll(ROTATED)
        if (authError) return { data: { user: null }, error: authError }
        return { data: { user: signedIn ? { id: 'u1' } : null }, error: null }
      },
    },
  }),
}))

async function run(pathname: string) {
  const { middleware } = await import('../../middleware')
  const { NextRequest } = await import('next/server')
  const request = new NextRequest(new URL(`https://reviewdot.in${pathname}`))
  return middleware(request)
}

function cookieNames(response: Response): string[] {
  return (response.headers.getSetCookie?.() ?? []).map((line) => line.split('=')[0]!)
}

describe('middleware session refresh', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    delete process.env.NEXT_PUBLIC_DEMO_MODE
    signedIn = true
    authError = null
  })

  it('keeps the rotated session when it passes a request through', async () => {
    const response = await run('/app')
    expect(cookieNames(response)).toEqual(
      expect.arrayContaining(['sb-access-token', 'sb-refresh-token']),
    )
  })

  it('keeps the rotated session when it bounces a signed-in user off /login', async () => {
    // The case that loses a session in ordinary use: someone still signed in
    // opens the log-in page — from a bookmark, the marketing header, or by
    // coming back to the site — and is sent to the dashboard. The refresh that
    // happened on the way past must reach the browser, or that bounce is the
    // last request the session survives.
    const response = await run('/login')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/app')
    expect(cookieNames(response)).toEqual(
      expect.arrayContaining(['sb-access-token', 'sb-refresh-token']),
    )
  })

  it('keeps the cleared session when it turns a signed-out request away', async () => {
    // Same mechanism in reverse: a dead token makes Supabase clear the cookies,
    // and dropping that leaves the browser replaying it on every request.
    signedIn = false
    const response = await run('/app/settings')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
    expect(cookieNames(response)).toEqual(
      expect.arrayContaining(['sb-access-token', 'sb-refresh-token']),
    )
  })
})

describe('when the auth server cannot be reached', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    delete process.env.NEXT_PUBLIC_DEMO_MODE
    signedIn = true
  })

  it('does not send a signed-in user to the login page over a network failure', async () => {
    // The reported symptom, exactly: a correct password, a real session, and
    // the very next request lands back on the login form. Nothing here says
    // this person is logged out — only that we could not ask.
    authError = { name: 'AuthRetryableFetchError' }
    const response = await run('/app')
    expect(response.status).not.toBe(307)
    expect(response.headers.get('location')).toBeNull()
  })

  it('does not sign anyone out because the auth server returned a 500', async () => {
    authError = { name: 'AuthApiError', status: 503 }
    const response = await run('/app/settings')
    expect(response.status).not.toBe(307)
  })

  it('still turns away a request the auth server actually rejected', async () => {
    // a rejected token is a real answer, and it must still gate the dashboard
    authError = { name: 'AuthApiError', status: 401 }
    const response = await run('/app')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })
})
