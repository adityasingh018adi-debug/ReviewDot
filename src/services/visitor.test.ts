import { describe, expect, it } from 'vitest'
import { computeVisitorHash, trimHeader, utcDay } from './visitor.server'

const base = { secret: 'test-secret', ip: '203.0.113.7', userAgent: 'Mozilla/5.0 iPhone', day: '2026-09-22' }

describe('computeVisitorHash', () => {
  it('is stable for the same device on the same day', () => {
    expect(computeVisitorHash(base)).toBe(computeVisitorHash(base))
  })

  it('separates two devices behind the same address', () => {
    expect(computeVisitorHash(base)).not.toBe(
      computeVisitorHash({ ...base, userAgent: 'Mozilla/5.0 Android' }),
    )
  })

  it('separates the same device on two addresses', () => {
    expect(computeVisitorHash(base)).not.toBe(computeVisitorHash({ ...base, ip: '198.51.100.4' }))
  })

  it('rotates daily, so a device cannot be followed across days', () => {
    expect(computeVisitorHash(base)).not.toBe(computeVisitorHash({ ...base, day: '2026-09-23' }))
  })

  it('cannot be reproduced without the secret', () => {
    expect(computeVisitorHash(base)).not.toBe(computeVisitorHash({ ...base, secret: 'other-secret' }))
  })

  it('stores nothing that contains the address or user agent', () => {
    const hash = computeVisitorHash(base)
    expect(hash).toMatch(/^[0-9a-f]{24}$/)
    expect(hash).not.toContain('203')
    expect(hash).not.toContain('113')
    expect(hash.toLowerCase()).not.toContain('iphone')
  })
})

describe('utcDay', () => {
  it('formats a UTC day', () => {
    expect(utcDay(new Date('2026-09-22T23:59:59Z'))).toBe('2026-09-22')
    expect(utcDay(new Date('2026-09-23T00:00:01Z'))).toBe('2026-09-23')
  })
})

describe('trimHeader', () => {
  it('caps the length so a hostile header cannot bloat a row', () => {
    expect(trimHeader('x'.repeat(5_000))).toHaveLength(400)
  })

  it('treats blank and missing the same way', () => {
    expect(trimHeader(null)).toBeNull()
    expect(trimHeader('   ')).toBeNull()
  })
})
