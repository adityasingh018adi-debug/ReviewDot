import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * What happens when writing the session cookie fails.
 *
 * Next refuses cookie writes from a Server Component by design, and that
 * refusal has to stay quiet — middleware refreshes the session on every
 * request, so nothing is lost. Any other failure is the opposite: it means a
 * sign-in did not persist, the action redirects to a dashboard the browser has
 * no session for, and the user lands back on the login form as though the
 * password were wrong. Swallowing both the same way is how that becomes
 * unexplainable.
 */

const set = vi.fn()
const getAll = vi.fn(() => [])
let requestHost = 'www.reviewdot.in'
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll, set, delete: vi.fn() }),
  headers: async () => ({ get: (name: string) => (name === 'host' ? requestHost : null) }),
}))

const reportError = vi.fn()
vi.mock('@/lib/observability', () => ({ reportError }))

/** Captures the adapter the client was built with, so we can drive setAll. */
let adapter: { setAll: (list: { name: string; value: string; options?: unknown }[]) => void }
let builtWith: { cookieOptions?: { domain?: string } } = {}
vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: typeof adapter; cookieOptions?: { domain?: string } },
  ) => {
    adapter = options.cookies
    builtWith = options
    return {}
  },
}))

async function buildClient() {
  const { serverClient } = await import('./supabase.server')
  await serverClient()
  return adapter
}

describe('the session cookie writer', () => {
  beforeEach(() => {
    vi.resetModules()
    set.mockReset()
    reportError.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    requestHost = 'www.reviewdot.in'
    builtWith = {}
  })

  it('writes the cookies it is given', async () => {
    const cookieAdapter = await buildClient()
    cookieAdapter.setAll([{ name: 'sb-access-token', value: 'abc', options: { path: '/' } }])
    expect(set).toHaveBeenCalledWith('sb-access-token', 'abc', { path: '/' })
    expect(reportError).not.toHaveBeenCalled()
  })

  it('stays quiet when a Server Component refuses the write', async () => {
    set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler')
    })
    const cookieAdapter = await buildClient()
    cookieAdapter.setAll([{ name: 'sb-access-token', value: 'abc' }])
    // expected, and harmless: middleware refreshes on the next request
    expect(reportError).not.toHaveBeenCalled()
  })

  it('records any other failure rather than losing the session in silence', async () => {
    set.mockImplementation(() => {
      throw new Error('cookie store unavailable')
    })
    const cookieAdapter = await buildClient()
    cookieAdapter.setAll([{ name: 'sb-access-token', value: 'abc' }])
    expect(reportError).toHaveBeenCalledTimes(1)
    expect(reportError.mock.calls[0]![0]).toBe('auth.cookie')
    // the names are ids, not contents — nothing secret reaches a log line
    expect(JSON.stringify(reportError.mock.calls[0]![2])).not.toContain('abc')
  })
})

describe('which domain the session cookie is written for', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    builtWith = {}
  })

  it('widens it so www and the bare domain share one sign-in', async () => {
    // host-only is the default, and it means signing in on reviewdot.in leaves
    // www.reviewdot.in with no session at all — the bounce back to the login
    // form that no amount of fixing the app can explain
    requestHost = 'www.reviewdot.in'
    await buildClient()
    expect(builtWith.cookieOptions?.domain).toBe('.reviewdot.in')

    vi.resetModules()
    requestHost = 'reviewdot.in'
    await buildClient()
    expect(builtWith.cookieOptions?.domain).toBe('.reviewdot.in')
  })

  it('leaves local development on the host-only default', async () => {
    requestHost = 'localhost:3000'
    await buildClient()
    expect(builtWith.cookieOptions).toBeUndefined()
  })
})
