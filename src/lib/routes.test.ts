import { describe, expect, it } from 'vitest'
import { isProtectedPath, isSignedOutOnlyPath } from './routes'

describe('isProtectedPath', () => {
  it('protects the dashboard and everything under it', () => {
    for (const path of [
      '/app',
      '/app/',
      '/app/outlets',
      '/app/products/prod-1',
      '/app/feedback?status=new'.split('?')[0]!,
      '/onboarding',
      '/onboarding/anything',
    ]) {
      expect(isProtectedPath(path), path).toBe(true)
    }
  })

  it('leaves the public site alone', () => {
    for (const path of [
      '/',
      '/pricing',
      '/product',
      '/login',
      '/signup',
      '/r/abc123',
      '/api/ai/review',
      '/robots.txt',
      // gating this one would break every email confirmation, password reset
      // and Google sign-in, because the code is exchanged for a session here —
      // before there is a session to check
      '/auth/callback',
      // and this one is opened by someone who has no account yet
      '/join/2f6c8a1b',
      '/reset-password',
    ]) {
      expect(isProtectedPath(path), path).toBe(false)
    }
  })

  it('matches whole segments, so a lookalike path is not swept in', () => {
    // a plain startsWith('/app') would gate these by accident
    expect(isProtectedPath('/apples')).toBe(false)
    expect(isProtectedPath('/application')).toBe(false)
    expect(isProtectedPath('/onboarding-guide')).toBe(false)
  })
})

describe('isSignedOutOnlyPath', () => {
  it('lists the screens a signed-in user has no use for', () => {
    expect(isSignedOutOnlyPath('/login')).toBe(true)
    expect(isSignedOutOnlyPath('/signup')).toBe(true)
    expect(isSignedOutOnlyPath('/forgot-password')).toBe(true)
  })

  it('does not include the reset screen, which needs a recovery session', () => {
    expect(isSignedOutOnlyPath('/reset-password')).toBe(false)
  })

  it('does not match by prefix', () => {
    expect(isSignedOutOnlyPath('/login/extra')).toBe(false)
  })
})
