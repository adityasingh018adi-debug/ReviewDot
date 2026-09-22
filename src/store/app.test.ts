import { describe, expect, it } from 'vitest'
import { useApp } from './app'
import { outlets } from '@/lib/data'

/**
 * The scan code is the only thing standing between a URL and someone else's
 * campaign, so its shape is worth asserting rather than assuming.
 */
describe('createQR', () => {
  const draft = {
    label: 'Table 04',
    type: 'table' as const,
    outletId: outlets[0]!.id,
    location: 'Table 04',
    destination: 'google' as const,
    destinationUrl: 'https://g.page/r/example/review',
  }

  it('gives every code an unguessable scan id', () => {
    const record = useApp.getState().createQR(draft)
    expect(record.code).toMatch(/^[a-hj-km-np-z2-9]{10}$/)
  })

  it('never reuses a code', () => {
    const codes = new Set(
      Array.from({ length: 500 }, () => useApp.getState().createQR(draft).code),
    )
    expect(codes.size).toBe(500)
  })

  it('does not derive the code from anything readable', () => {
    const record = useApp.getState().createQR({ ...draft, label: 'Table 04' })
    // a code built from the label, outlet or business would leak which is which
    expect(record.code).not.toContain('table')
    expect(record.code).not.toContain('04')
  })

  it('carries a human-readable reference for print, separate from the scan code', () => {
    const record = useApp.getState().createQR(draft)
    expect(record.reference).toMatch(/^RD-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}$/)
    expect(record.reference).not.toContain(record.code)
  })

  it('reflects the placement in the reference rather than a fixed suffix', () => {
    const table = useApp.getState().createQR({ ...draft, location: 'Table 07' })
    const counter = useApp.getState().createQR({ ...draft, location: 'Counter' })
    expect(table.reference).not.toBe(counter.reference)
    expect(table.reference).toContain('T07')
  })
})
