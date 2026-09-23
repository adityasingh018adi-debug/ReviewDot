import { describe, expect, it } from 'vitest'
import { previousWindow, scopeFromParams, scopeToQuery, trendBetween } from './scope'

describe('scopeFromParams', () => {
  it('defaults to thirty days across every outlet', () => {
    const scope = scopeFromParams({})
    expect(scope.rangeKey).toBe('30d')
    expect(scope.outletId).toBeNull()
  })

  it('accepts the known range keys', () => {
    for (const key of ['today', '7d', '30d', '3m'] as const) {
      expect(scopeFromParams({ range: key }).rangeKey).toBe(key)
    }
  })

  it('falls back when the range is not one we know', () => {
    expect(scopeFromParams({ range: 'all-time' }).rangeKey).toBe('30d')
    expect(scopeFromParams({ range: '../../etc/passwd' }).rangeKey).toBe('30d')
  })

  it('takes a custom range only when both dates are valid and ordered', () => {
    expect(scopeFromParams({ range: 'custom', from: '2026-09-01', to: '2026-09-30' }).rangeKey).toBe('custom')
    expect(scopeFromParams({ range: 'custom', from: '2026-09-30', to: '2026-09-01' }).rangeKey).toBe('30d')
    expect(scopeFromParams({ range: 'custom', from: 'yesterday', to: 'today' }).rangeKey).toBe('30d')
    expect(scopeFromParams({ range: 'custom', from: '2026-09-01' }).rangeKey).toBe('30d')
  })

  it('only accepts an outlet that looks like an id', () => {
    const real = '0a000000-1111-2222-3333-444444444444'
    expect(scopeFromParams({ outlet: real }).outletId).toBe(real)
    expect(scopeFromParams({ outlet: 'all' }).outletId).toBeNull()
    expect(scopeFromParams({ outlet: "' or 1=1 --" }).outletId).toBeNull()
    expect(scopeFromParams({ outlet: 'out-thane' }).outletId).toBeNull()
  })

  it('takes the first value when a param is repeated', () => {
    expect(scopeFromParams({ range: ['7d', '3m'] }).rangeKey).toBe('7d')
  })
})

describe('previousWindow', () => {
  it('is the equally long window ending just before this one', () => {
    const scope = scopeFromParams({ range: '7d' })
    const previous = previousWindow(scope.range)
    expect(previous.to.getTime()).toBe(scope.range.from.getTime() - 1)
    const length = previous.to.getTime() - previous.from.getTime()
    expect(Math.round(length / 86_400_000)).toBe(7)
  })
})

describe('scopeToQuery', () => {
  it('leaves the defaults out so a plain link stays plain', () => {
    expect(scopeToQuery({ rangeKey: '30d', outletId: null })).toBe('')
  })

  it('keeps whatever is not the default', () => {
    expect(scopeToQuery({ rangeKey: '7d', outletId: null })).toBe('?range=7d')
    expect(scopeToQuery({ rangeKey: '30d', outletId: 'abc' })).toBe('?outlet=abc')
  })

  it('round-trips through scopeFromParams', () => {
    const outlet = '0a000000-1111-2222-3333-444444444444'
    const query = new URLSearchParams(scopeToQuery({ rangeKey: '7d', outletId: outlet }).slice(1))
    const back = scopeFromParams(Object.fromEntries(query))
    expect(back.rangeKey).toBe('7d')
    expect(back.outletId).toBe(outlet)
  })
})

describe('trendBetween', () => {
  it('is the signed change against the previous period', () => {
    expect(trendBetween(120, 100)).toBeCloseTo(0.2)
    expect(trendBetween(80, 100)).toBeCloseTo(-0.2)
  })

  it('treats growth from nothing as a full gain, and nothing from nothing as flat', () => {
    expect(trendBetween(5, 0)).toBe(1)
    expect(trendBetween(0, 0)).toBe(0)
  })
})
