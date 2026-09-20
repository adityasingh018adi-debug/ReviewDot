import { describe, expect, it } from 'vitest'
import jsQR from 'jsqr'
import { encodeQR, qrPath, qrSvg, type QRMatrix } from './qr'

/** Render a matrix to an RGBA bitmap so a real decoder can read it back. */
function toBitmap(matrix: QRMatrix, scale = 4, margin = 4) {
  const side = (matrix.size + margin * 2) * scale
  const data = new Uint8ClampedArray(side * side * 4).fill(255)
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (!matrix.modules[r][c]) continue
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const px = ((r + margin) * scale + y) * side + (c + margin) * scale + x
          data[px * 4] = 0
          data[px * 4 + 1] = 0
          data[px * 4 + 2] = 0
        }
      }
    }
  }
  return { data, side }
}

function roundTrip(text: string): string | null {
  const matrix = encodeQR(text)
  const { data, side } = toBitmap(matrix)
  return jsQR(data, side, side)?.data ?? null
}

describe('encodeQR', () => {
  const payloads = [
    'https://reviewdot.in/r/abc123',
    'https://reviewdot.in/r/lovelatte-thane-t12',
    'ReviewDot',
    'https://reviewdot.in/r/9f2b71?utm_source=table&utm_campaign=diwali-2026',
    'https://reviewdot.in/r/' + 'x'.repeat(100),
  ]

  it.each(payloads)('round-trips through a real decoder: %s', (text) => {
    expect(roundTrip(text)).toBe(text)
  })

  it('grows the version with the payload size', () => {
    expect(encodeQR('ReviewDot').version).toBe(1)
    expect(encodeQR('https://reviewdot.in/r/' + 'x'.repeat(100)).version).toBeGreaterThan(4)
  })

  it('produces a square matrix of 4v+17 modules', () => {
    const matrix = encodeQR('https://reviewdot.in/r/abc123')
    expect(matrix.size).toBe(matrix.version * 4 + 17)
    expect(matrix.modules).toHaveLength(matrix.size)
    matrix.modules.forEach((row) => expect(row).toHaveLength(matrix.size))
  })

  it('places the three finder patterns', () => {
    const { modules, size } = encodeQR('https://reviewdot.in/r/abc123')
    for (const [row, col] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ]) {
      expect(modules[row][col]).toBe(true)
      expect(modules[row + 1][col + 1]).toBe(false)
      expect(modules[row + 3][col + 3]).toBe(true)
    }
  })

  it('is deterministic and payload-sensitive', () => {
    expect(encodeQR('a')).toEqual(encodeQR('a'))
    expect(encodeQR('a')).not.toEqual(encodeQR('b'))
  })

  it('rejects payloads beyond version 10 capacity', () => {
    expect(() => encodeQR('x'.repeat(500))).toThrow(/too long/)
  })
})

describe('qrPath / qrSvg', () => {
  it('emits one square per dark module', () => {
    const matrix = encodeQR('ReviewDot')
    const dark = matrix.modules.flat().filter(Boolean).length
    expect(qrPath(matrix).match(/M/g)).toHaveLength(dark)
  })

  it('emits standalone svg markup with a quiet zone', () => {
    const svg = qrSvg('https://reviewdot.in/r/abc123', { size: 256, margin: 2 })
    expect(svg).toContain('<svg')
    expect(svg).toContain('width="256"')
    const matrix = encodeQR('https://reviewdot.in/r/abc123')
    expect(svg).toContain(`viewBox="0 0 ${matrix.size + 4} ${matrix.size + 4}"`)
  })
})
