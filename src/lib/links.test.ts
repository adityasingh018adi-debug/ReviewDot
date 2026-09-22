import { afterEach, describe, expect, it } from 'vitest'
import { displayUrl, scanUrl, PUBLIC_DOMAIN } from './links'

const original = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = original
})

describe('links', () => {
  it('prints the short domain on collateral', () => {
    expect(displayUrl('abc123')).toBe('reviewdot.in/r/abc123')
    expect(PUBLIC_DOMAIN).toBe('reviewdot.in')
  })

  it('encodes a path-based scan URL from the configured origin', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://reviewdot.in'
    expect(scanUrl('abc123')).toBe('https://reviewdot.in/r/abc123')
  })

  it('trims a trailing slash on the configured origin', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.reviewdot.in/'
    expect(scanUrl('abc123')).toBe('https://staging.reviewdot.in/r/abc123')
  })

  it('falls back to the public domain when nothing is configured', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(scanUrl('abc123')).toBe('https://reviewdot.in/r/abc123')
  })
})
