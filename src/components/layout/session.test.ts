import { describe, expect, it } from 'vitest'
import { initialsOf } from './SessionProvider'

describe('initialsOf', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsOf('Ritika Shah')).toBe('RS')
    expect(initialsOf('love and latte')).toBe('LA')
  })

  it('handles a single word', () => {
    expect(initialsOf('Ritika')).toBe('R')
  })

  it('ignores extra whitespace', () => {
    expect(initialsOf('  Ritika   Shah  ')).toBe('RS')
  })

  it('falls back when there is no name to work with', () => {
    expect(initialsOf('')).toBe('?')
    expect(initialsOf('   ')).toBe('?')
    expect(initialsOf('', 'RD')).toBe('RD')
  })

  it('works on an email address, which is the fallback display name', () => {
    expect(initialsOf('ritika@loveandlatte.in')).toBe('R')
  })
})
