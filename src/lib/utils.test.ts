import { describe, expect, it } from 'vitest'
import { clamp, formatCompact, formatPercent, formatTrend, groupBy, initialsOf, slugify, trend } from './utils'

describe('formatting helpers', () => {
  it('compacts large numbers', () => {
    expect(formatCompact(940)).toBe('940')
    expect(formatCompact(1000)).toBe('1K')
    expect(formatCompact(1248)).toBe('1.2K')
    expect(formatCompact(1_000_000)).toBe('1M')
  })

  it('formats percentages and trends', () => {
    expect(formatPercent(0.2612)).toBe('26.1%')
    expect(formatTrend(0.12)).toBe('+12%')
    expect(formatTrend(-0.08)).toBe('-8%')
  })

  it('computes period-over-period trend safely', () => {
    expect(trend(1248, 1114)).toBeCloseTo(0.12, 2)
    expect(trend(10, 0)).toBe(1)
    expect(trend(0, 0)).toBe(0)
  })
})

describe('small utilities', () => {
  it('clamps, slugifies and derives initials', () => {
    expect(clamp(7, 0, 5)).toBe(5)
    expect(slugify('Mango Cheesecake!')).toBe('mango-cheesecake')
    expect(initialsOf('Love & Latte')).toBe('L&')
  })

  it('groups while preserving order', () => {
    const grouped = groupBy([{ t: 'a' }, { t: 'b' }, { t: 'a' }], (x) => x.t)
    expect([...grouped.keys()]).toEqual(['a', 'b'])
    expect(grouped.get('a')).toHaveLength(2)
  })
})
