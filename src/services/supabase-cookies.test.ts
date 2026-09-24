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
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll, set, delete: vi.fn() }) }))

const reportError = vi.fn()
vi.mock('@/lib/observability', () => ({ reportError }))

/** Captures the adapter the client was built with, so we can drive setAll. */
let adapter: { setAll: (list: { name: string; value: string; options?: unknown }[]) => void }
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: typeof adapter }) => {
    adapter = options.cookies
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
