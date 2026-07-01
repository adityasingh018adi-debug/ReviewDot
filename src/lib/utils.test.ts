import { describe, it, expect } from 'vitest'
import { cn, formatCompact, timeAgo, clamp } from './utils'

describe('cn', () => {
  it('joins truthy classes and drops falsy ones', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c')
  })
})

describe('formatCompact', () => {
  it('formats thousands and millions', () => {
    expect(formatCompact(950)).toBe('950')
    expect(formatCompact(1500)).toBe('1.5K')
    expect(formatCompact(2_400_000)).toBe('2.4M')
  })
  it('handles negatives', () => {
    expect(formatCompact(-1500)).toBe('-1.5K')
  })
})

describe('timeAgo', () => {
  it('describes recent times', () => {
    expect(timeAgo(new Date(Date.now() - 30_000))).toBe('just now')
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe('5m ago')
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toBe('3h ago')
    expect(timeAgo(new Date(Date.now() - 2 * 86_400_000))).toBe('2d ago')
  })
})

describe('clamp', () => {
  it('bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})
