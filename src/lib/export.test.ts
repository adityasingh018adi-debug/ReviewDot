import { describe, expect, it } from 'vitest'
import { qrSheetHtml, toCSV } from './export'

describe('toCSV', () => {
  it('writes a header row and escapes commas and quotes', () => {
    const csv = toCSV([
      { product: 'Mango Cheesecake', reviews: 86, note: 'fresh, creamy' },
      { product: 'Tiramisu', reviews: 72, note: 'says "best in town"' },
    ])
    const [header, first, second] = csv.split('\n')
    expect(header).toBe('product,reviews,note')
    expect(first).toBe('Mango Cheesecake,86,"fresh, creamy"')
    expect(second).toContain('"says ""best in town"""')
  })

  it('returns an empty string for no rows', () => {
    expect(toCSV([])).toBe('')
  })
})

describe('qrSheetHtml', () => {
  it('embeds a scannable QR and the printed link', () => {
    const html = qrSheetHtml({
      businessName: 'Love & Latte',
      title: 'Table 12',
      subtitle: 'Loved your experience?',
      url: 'https://reviewdot.in/r/abc123',
      footnote: 'Your feedback helps us grow',
    })
    expect(html).toContain('Love &amp; Latte'.replace('&amp;', '&'))
    expect(html).toContain('<svg')
    expect(html).toContain('reviewdot.in/r/abc123')
    expect(html).toContain('window.print()')
  })
})
