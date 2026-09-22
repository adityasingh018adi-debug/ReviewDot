import { describe, expect, it } from 'vitest'
import {
  generatePublicId,
  parseReferenceCode,
  placementCode,
  referenceCode,
  shortCodeFor,
} from './qr-identity'

describe('generatePublicId', () => {
  it('produces unguessable ids of the requested length', () => {
    const id = generatePublicId()
    expect(id).toHaveLength(10)
    expect(id).toMatch(/^[a-z2-9]+$/)
  })

  it('avoids look-alike characters', () => {
    const sample = Array.from({ length: 200 }, () => generatePublicId()).join('')
    for (const confusing of ['l', 'i', 'o', '0', '1']) {
      expect(sample).not.toContain(confusing)
    }
  })

  it('does not collide across many draws', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => generatePublicId()))
    expect(ids.size).toBe(5000)
  })
})

describe('shortCodeFor', () => {
  it('uses initials for multi-word names', () => {
    expect(shortCodeFor('Love & Latte')).toBe('LL')
    expect(shortCodeFor('Runway Bites Cloud Kitchen')).toBe('RBCK')
  })

  it('falls back to the first word for single-word names', () => {
    expect(shortCodeFor('Thane')).toBe('THAN')
    expect(shortCodeFor('Pune', 2)).toBe('PU')
  })

  it('always returns at least two characters', () => {
    expect(shortCodeFor('!!!').length).toBeGreaterThanOrEqual(2)
    expect(shortCodeFor('A').length).toBeGreaterThanOrEqual(2)
  })
})

describe('placementCode', () => {
  it('compacts numbered placements', () => {
    expect(placementCode('Table 04')).toBe('T04')
    expect(placementCode('Table 4')).toBe('T04')
    expect(placementCode('Room 112')).toBe('R112')
  })

  it('abbreviates named placements', () => {
    expect(placementCode('Counter')).toBe('COU')
    expect(placementCode('Packaging')).toBe('PAC')
  })

  it('uses the fallback when no placement is given', () => {
    expect(placementCode(undefined)).toBe('GEN')
    expect(placementCode('  ', 'PKG')).toBe('PKG')
  })
})

describe('referenceCode', () => {
  it('builds the printed label from its parts', () => {
    expect(
      referenceCode({ orgShortCode: 'LL', outletShortCode: 'TH', placement: 'Table 04' }),
    ).toBe('RD-LL-TH-T04')
  })

  it('round-trips through the parser', () => {
    const code = referenceCode({ orgShortCode: 'LL', outletShortCode: 'BN', placement: 'Counter' })
    expect(parseReferenceCode(code)).toEqual({
      orgShortCode: 'LL',
      outletShortCode: 'BN',
      placement: 'COU',
    })
  })

  it('rejects malformed codes', () => {
    expect(parseReferenceCode('not-a-code')).toBeNull()
    expect(parseReferenceCode('RD-LL-TH')).toBeNull()
  })
})
