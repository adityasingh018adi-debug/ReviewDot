import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Where an authenticated request is sent when it cannot render a dashboard.
 *
 * The distinction this pins is the whole bug: "nobody is signed in" and "signed
 * in, but not a member of any organization yet" are different facts with
 * different answers, and answering /login to the second one bounces a valid
 * session back and forth with the middleware, which sees the session and
 * returns the user to the dashboard.
 */

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`)
})
vi.mock('next/navigation', () => ({ redirect }))

const getWorkspaceSession = vi.fn()
vi.mock('./auth.server', () => ({ getWorkspaceSession }))

async function resolve() {
  const { dashboardContext } = await import('./dashboard-context.server')
  return dashboardContext()
}

describe('dashboardContext in live mode', () => {
  beforeEach(() => {
    vi.resetModules()
    redirect.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    delete process.env.NEXT_PUBLIC_DEMO_MODE
  })

  it('sends a request with no session to log in', async () => {
    getWorkspaceSession.mockResolvedValue(null)
    await expect(resolve()).rejects.toThrow('REDIRECT:/login')
  })

  it('sends a signed-in user with no organization to onboarding, not to log in', async () => {
    getWorkspaceSession.mockResolvedValue({
      user: { id: 'u1', email: 'someone@example.com' },
      memberships: [],
      active: null,
    })
    await expect(resolve()).rejects.toThrow('REDIRECT:/onboarding')
    expect(redirect).not.toHaveBeenCalledWith('/login')
  })

  it('resolves the workspace when there is one', async () => {
    getWorkspaceSession.mockResolvedValue({
      user: { id: 'u1', email: 'someone@example.com' },
      memberships: [],
      active: {
        organizationId: 'org-1',
        organizationName: 'Love & Latte',
        role: 'OWNER',
        assignedOutletIds: [],
      },
    })
    const context = await resolve()
    expect(context.organizationId).toBe('org-1')
    expect(context.mode).toBe('live')
    expect(redirect).not.toHaveBeenCalled()
  })
})
