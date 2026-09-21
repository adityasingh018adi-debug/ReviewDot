import { describe, expect, it } from 'vitest'
import { niceMax, scaleLinear, smoothPath, ticksFor } from './chart-utils'

describe('scaleLinear', () => {
  it('maps a domain onto a pixel range', () => {
    const scale = scaleLinear([0, 100], [0, 200])
    expect(scale(0)).toBe(0)
    expect(scale(50)).toBe(100)
    expect(scale(100)).toBe(200)
  })

  it('survives a zero-width domain', () => {
    expect(scaleLinear([5, 5], [0, 10])(5)).toBe(0)
  })
})

describe('niceMax', () => {
  it('rounds the axis ceiling up to a readable number', () => {
    expect(niceMax(86)).toBe(100)
    expect(niceMax(1248)).toBe(1600)
    expect(niceMax(3)).toBe(4)
    expect(niceMax(0)).toBe(4)
  })

  it('always covers the data', () => {
    for (const value of [1, 7, 19, 210, 999, 1248]) {
      expect(niceMax(value)).toBeGreaterThanOrEqual(value)
    }
  })
})

describe('ticksFor', () => {
  it('returns evenly spaced ticks including both ends', () => {
    expect(ticksFor(100, 4)).toEqual([0, 25, 50, 75, 100])
  })
})

describe('smoothPath', () => {
  it('starts with a move command and emits a curve per segment', () => {
    const path = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 2 },
    ])
    expect(path.startsWith('M0,0')).toBe(true)
    expect(path.match(/C/g)).toHaveLength(2)
  })

  it('handles degenerate inputs', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([{ x: 3, y: 4 }])).toBe('M3,4')
  })
})
