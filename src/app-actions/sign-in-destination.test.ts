import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Where a sign-in lands.
 *
 * The rule has two halves and the second is the one worth testing. Deciding
 * from membership sends a brand-new account to onboarding instead of bouncing
 * it off the dashboard — but applied on its own it would also send an invited
 * person there, and they have no workspace precisely because they are on their
 * way to join somebody else's. An explicit destination has to win.
 */

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`)
})
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const signInWithPassword = vi.fn()
vi.mock('@/services/supabase.server', () => ({
  serverClient: async () => ({ auth: { signInWithPassword } }),
}))

const getMemberships = vi.fn()
vi.mock('@/services/auth.server', () => ({
  ACTIVE_ORG_COOKIE: 'reviewdot-org',
  SupabaseAuthService: class {
    getMemberships = getMemberships
  },
}))

const membership = {
  organizationId: 'org-1',
  organizationName: 'Love & Latte',
  role: 'OWNER',
  assignedOutletIds: [],
}

async function signIn(fields: Record<string, string>) {
  const { signInAction } = await import('./auth')
  const form = new FormData()
  form.set('email', 'someone@example.com')
  form.set('password', 'correct-horse')
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return signInAction(form)
}

describe('signInAction', () => {
  beforeEach(() => {
    vi.resetModules()
    redirect.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    signInWithPassword.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    })
    getMemberships.mockResolvedValue([membership])
  })

  it('sends an existing member to the dashboard', async () => {
    await expect(signIn({})).rejects.toThrow('REDIRECT:/app')
  })

  it('sends an account with no workspace straight to onboarding', async () => {
    // not to /app, which would only bounce them here a request later
    getMemberships.mockResolvedValue([])
    await expect(signIn({})).rejects.toThrow('REDIRECT:/onboarding')
  })

  it('honours an invitation over onboarding', async () => {
    // the whole point of an invitation is joining somebody else's workspace;
    // onboarding would have them create a second business instead
    getMemberships.mockResolvedValue([])
    await expect(signIn({ next: '/join/2f6c8a1b' })).rejects.toThrow('REDIRECT:/join/2f6c8a1b')
  })

  it('honours a requested page for an existing member', async () => {
    await expect(signIn({ next: '/app/settings' })).rejects.toThrow('REDIRECT:/app/settings')
  })

  it('refuses a destination that would leave the site, and still decides', async () => {
    getMemberships.mockResolvedValue([])
    await expect(signIn({ next: 'https://evil.example' })).rejects.toThrow('REDIRECT:/onboarding')
  })

  it('does not redirect at all when the credentials are wrong', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: new Error('bad') })
    const result = await signIn({})
    expect(result.error).toMatch(/did not match/i)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('does not redirect when no session came back', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: null }, error: null })
    const result = await signIn({})
    expect(result.error).toMatch(/could not start a session/i)
    expect(redirect).not.toHaveBeenCalled()
  })
})
