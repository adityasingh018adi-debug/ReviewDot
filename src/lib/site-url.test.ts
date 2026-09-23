import { describe, expect, it } from 'vitest'
import { safeNextPath } from './site-url'

describe('safeNextPath', () => {
  it('keeps a same-site path', () => {
    expect(safeNextPath('/app/outlets')).toBe('/app/outlets')
    expect(safeNextPath('/app/feedback?status=new')).toBe('/app/feedback?status=new')
  })

  it('falls back when there is nothing to go back to', () => {
    expect(safeNextPath(null)).toBe('/app')
    expect(safeNextPath(undefined)).toBe('/app')
    expect(safeNextPath('')).toBe('/app')
  })

  it('honours a caller-supplied fallback', () => {
    // signup sends someone to onboarding by default, but to the invitation they
    // came from when there is one — and to onboarding, not /app, when there is not
    expect(safeNextPath(null, '/onboarding')).toBe('/onboarding')
    expect(safeNextPath('https://evil.example', '/onboarding')).toBe('/onboarding')
    expect(safeNextPath('/join/abc', '/onboarding')).toBe('/join/abc')
  })

  it('refuses anything that would leave the site', () => {
    for (const hostile of [
      'https://evil.example',
      'http://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'evil.example',
    ]) {
      expect(safeNextPath(hostile)).toBe('/app')
    }
  })
})
