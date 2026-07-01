import { describe, it, expect } from 'vitest'
import { fuzzyScore } from './fuzzy'

describe('fuzzyScore', () => {
  it('matches subsequences and rejects non-matches', () => {
    expect(fuzzyScore('gtd', 'Go to Dashboard')).not.toBeNull()
    expect(fuzzyScore('xyz', 'Go to Dashboard')).toBeNull()
  })

  it('ranks tighter matches higher', () => {
    const exact = fuzzyScore('dash', 'Go to Dashboard')!
    const sparse = fuzzyScore('dash', 'Do all such hard things')!
    expect(exact).toBeGreaterThan(sparse)
  })

  it('empty query matches everything with zero score', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
  })
})
