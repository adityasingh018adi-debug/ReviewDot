import { describe, expect, it } from 'vitest'
import { sessionCookieDomain } from './cookie-domain'

describe('sessionCookieDomain', () => {
  it('shares one session between the bare domain and www', () => {
    expect(sessionCookieDomain('reviewdot.in')).toBe('.reviewdot.in')
    expect(sessionCookieDomain('www.reviewdot.in')).toBe('.reviewdot.in')
  })

  it('ignores the port', () => {
    expect(sessionCookieDomain('reviewdot.in:3000')).toBe('.reviewdot.in')
  })

  it('leaves development alone', () => {
    expect(sessionCookieDomain('localhost')).toBeUndefined()
    expect(sessionCookieDomain('localhost:3000')).toBeUndefined()
    expect(sessionCookieDomain('127.0.0.1:4173')).toBeUndefined()
  })

  it('refuses to widen anything it cannot be sure of', () => {
    // sharing a cookie with every other tenant of a hosting domain, or with
    // every .co.uk, is worse than the problem it would solve — and browsers
    // reject those anyway
    expect(sessionCookieDomain('reviewdot.co.uk')).toBeUndefined()
    expect(sessionCookieDomain('reviewdot.vercel.app')).toBeUndefined()
    expect(sessionCookieDomain('staging.reviewdot.in')).toBeUndefined()
    expect(sessionCookieDomain('')).toBeUndefined()
    expect(sessionCookieDomain(null)).toBeUndefined()
  })
})
