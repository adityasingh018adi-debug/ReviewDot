/**
 * Minimal QR Code encoder (byte mode, ECC level M, versions 1–10).
 *
 * ReviewDot generates QR codes in the browser, so the encoder is dependency-free
 * and returns a plain boolean matrix that can be rendered as SVG, <canvas>, or PDF.
 * Correctness is verified in qr.test.ts by decoding the rendered matrix with jsQR.
 */

/** Data + EC block layout per version, ECC level M. */
type VersionSpec = {
  /** EC codewords per block */
  ec: number
  /** [blocks, data codewords per block] for group 1 and (optional) group 2 */
  g1: [number, number]
  g2?: [number, number]
}

const VERSIONS: VersionSpec[] = [
  { ec: 10, g1: [1, 16] },
  { ec: 16, g1: [1, 28] },
  { ec: 26, g1: [1, 44] },
  { ec: 18, g1: [2, 32] },
  { ec: 24, g1: [2, 43] },
  { ec: 16, g1: [4, 27] },
  { ec: 18, g1: [4, 31] },
  { ec: 22, g1: [2, 38], g2: [2, 39] },
  { ec: 22, g1: [3, 36], g2: [2, 37] },
  { ec: 26, g1: [4, 43], g2: [1, 44] },
]

const ALIGNMENT: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

function dataCapacity(spec: VersionSpec): number {
  return spec.g1[0] * spec.g1[1] + (spec.g2 ? spec.g2[0] * spec.g2[1] : 0)
}

/* ------------------------------------------------------------------ *
 * Galois field (GF(256), primitive polynomial 0x11d) for Reed–Solomon
 * ------------------------------------------------------------------ */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

/** Generator polynomial for `degree` error-correction codewords. */
function rsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

function rsEncode(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGenerator(ecLength)
  const remainder = new Uint8Array(ecLength)
  for (const byte of data) {
    const factor = byte ^ remainder[0]
    remainder.copyWithin(0, 1)
    remainder[ecLength - 1] = 0
    if (factor !== 0) {
      for (let i = 0; i < ecLength; i++) remainder[i] ^= gfMul(gen[i + 1], factor)
    }
  }
  return remainder
}

/* ------------------------------------------------------------------ *
 * Bit buffer
 * ------------------------------------------------------------------ */

class BitBuffer {
  private bits: number[] = []

  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1)
  }

  get length() {
    return this.bits.length
  }

  toBytes(byteLength: number): Uint8Array {
    const out = new Uint8Array(byteLength)
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i]) out[i >> 3] |= 0x80 >> (i & 7)
    }
    return out
  }
}

/* ------------------------------------------------------------------ *
 * Encoding
 * ------------------------------------------------------------------ */

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= VERSIONS.length; v++) {
    const spec = VERSIONS[v - 1]
    const countBits = v < 10 ? 8 : 16
    const needed = 4 + countBits + byteLength * 8
    if (needed <= dataCapacity(spec) * 8) return v
  }
  throw new Error(`QR payload too long (${byteLength} bytes); max ${dataCapacity(VERSIONS[9])} codewords`)
}

function buildCodewords(bytes: Uint8Array, version: number): Uint8Array {
  const spec = VERSIONS[version - 1]
  const capacity = dataCapacity(spec)
  const buffer = new BitBuffer()
  buffer.put(0b0100, 4) // byte mode
  buffer.put(bytes.length, version < 10 ? 8 : 16)
  for (const b of bytes) buffer.put(b, 8)

  // terminator + byte alignment
  const remaining = capacity * 8 - buffer.length
  buffer.put(0, Math.min(4, remaining))
  if (buffer.length % 8 !== 0) buffer.put(0, 8 - (buffer.length % 8))

  const data = buffer.toBytes(capacity)
  // pad bytes alternate 0xEC / 0x11
  let pad = 0xec
  for (let i = Math.ceil(buffer.length / 8); i < capacity; i++) {
    data[i] = pad
    pad = pad === 0xec ? 0x11 : 0xec
  }

  // split into blocks, interleave data then EC codewords
  const blocks: { data: Uint8Array; ec: Uint8Array }[] = []
  const groups: [number, number][] = spec.g2 ? [spec.g1, spec.g2] : [spec.g1]
  let offset = 0
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i++) {
      const slice = data.subarray(offset, offset + size)
      offset += size
      blocks.push({ data: slice, ec: rsEncode(slice, spec.ec) })
    }
  }

  const result: number[] = []
  const maxData = Math.max(...blocks.map((b) => b.data.length))
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) if (i < block.data.length) result.push(block.data[i])
  }
  for (let i = 0; i < spec.ec; i++) {
    for (const block of blocks) result.push(block.ec[i])
  }
  return Uint8Array.from(result)
}

/* ------------------------------------------------------------------ *
 * Matrix construction
 * ------------------------------------------------------------------ */

const FORMAT_MASK = 0x5412
const EC_LEVEL_M = 0b00

function bchFormat(data: number): number {
  let value = data << 10
  for (let i = 14; i >= 10; i--) {
    if ((value >>> i) & 1) value ^= 0x537 << (i - 10)
  }
  return ((data << 10) | value) ^ FORMAT_MASK
}

function bchVersion(version: number): number {
  let value = version << 12
  for (let i = 17; i >= 12; i--) {
    if ((value >>> i) & 1) value ^= 0x1f25 << (i - 12)
  }
  return (version << 12) | value
}

function maskBit(pattern: number, row: number, col: number): boolean {
  switch (pattern) {
    case 0:
      return (row + col) % 2 === 0
    case 1:
      return row % 2 === 0
    case 2:
      return col % 3 === 0
    case 3:
      return (row + col) % 3 === 0
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
  }
}

type Grid = { size: number; modules: boolean[][]; reserved: boolean[][] }

function newGrid(size: number): Grid {
  return {
    size,
    modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  }
}

function setModule(grid: Grid, row: number, col: number, dark: boolean, reserved = true) {
  grid.modules[row][col] = dark
  grid.reserved[row][col] = reserved
}

function placeFinder(grid: Grid, row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r
      const cc = col + c
      if (rr < 0 || cc < 0 || rr >= grid.size || cc >= grid.size) continue
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6))
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
      setModule(grid, rr, cc, inRing || inCore)
    }
  }
}

function placeAlignment(grid: Grid, version: number) {
  const centers = ALIGNMENT[version - 1]
  const last = grid.size - 7
  for (const r of centers) {
    for (const c of centers) {
      // the three centres that would sit on a finder pattern are omitted
      if ((r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6)) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
          setModule(grid, r + dr, c + dc, dark)
        }
      }
    }
  }
}

function reserveFormatAreas(grid: Grid, version: number) {
  const n = grid.size
  for (let i = 0; i < 9; i++) {
    if (!grid.reserved[8][i]) setModule(grid, 8, i, false)
    if (!grid.reserved[i][8]) setModule(grid, i, 8, false)
  }
  for (let i = 0; i < 8; i++) {
    setModule(grid, 8, n - 1 - i, false)
    setModule(grid, n - 1 - i, 8, false)
  }
  setModule(grid, n - 8, 8, true) // dark module
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3)
      const c = (i % 3) + n - 11
      setModule(grid, r, c, false)
      setModule(grid, c, r, false)
    }
  }
}

function placeData(grid: Grid, codewords: Uint8Array) {
  const n = grid.size
  let bitIndex = 0
  let upward = true
  for (let right = n - 1; right > 0; right -= 2) {
    if (right === 6) right-- // skip the vertical timing column
    for (let step = 0; step < n; step++) {
      const row = upward ? n - 1 - step : step
      for (const col of [right, right - 1]) {
        if (grid.reserved[row][col]) continue
        const byte = codewords[bitIndex >> 3]
        const dark = byte !== undefined && ((byte >> (7 - (bitIndex & 7))) & 1) === 1
        grid.modules[row][col] = dark
        bitIndex++
      }
    }
    upward = !upward
  }
}

function applyMask(grid: Grid, pattern: number): boolean[][] {
  return grid.modules.map((row, r) =>
    row.map((dark, c) => (grid.reserved[r][c] ? dark : dark !== maskBit(pattern, r, c))),
  )
}

function placeFormatInfo(modules: boolean[][], size: number, pattern: number) {
  const bits = bchFormat((EC_LEVEL_M << 3) | pattern)
  for (let i = 0; i < 15; i++) {
    const dark = ((bits >> i) & 1) === 1
    // copy 1 — hugging the top-left finder (column 8 down, then row 8 across)
    if (i < 6) modules[i][8] = dark
    else if (i === 6) modules[7][8] = dark
    else if (i === 7) modules[8][8] = dark
    else if (i === 8) modules[8][7] = dark
    else modules[8][14 - i] = dark
    // copy 2 — split between the top-right and bottom-left finders
    if (i < 8) modules[8][size - 1 - i] = dark
    else modules[size - 15 + i][8] = dark
  }
}

function placeVersionInfo(modules: boolean[][], size: number, version: number) {
  if (version < 7) return
  const bits = bchVersion(version)
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >> i) & 1) === 1
    const r = Math.floor(i / 3)
    const c = (i % 3) + size - 11
    modules[r][c] = dark
    modules[c][r] = dark
  }
}

/** Penalty scoring (ISO/IEC 18004 §8.8.2) — lower is better. */
function penalty(modules: boolean[][]): number {
  const n = modules.length
  let score = 0

  // rule 1: runs of 5+ same-colour modules in a row/column
  for (let i = 0; i < n; i++) {
    for (const line of [modules[i], modules.map((row) => row[i])]) {
      let run = 1
      for (let j = 1; j < n; j++) {
        if (line[j] === line[j - 1]) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
        }
      }
      if (run >= 5) score += run - 2
    }
  }

  // rule 2: 2x2 blocks of the same colour
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = modules[r][c]
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3
    }
  }

  // rule 3: finder-like 1:1:3:1:1 patterns
  const pattern = [true, false, true, true, true, false, true]
  const matches = (line: boolean[], start: number) => {
    for (let k = 0; k < 7; k++) if (line[start + k] !== pattern[k]) return false
    const before = line.slice(Math.max(0, start - 4), start)
    const after = line.slice(start + 7, start + 11)
    const clear = (part: boolean[]) => part.length >= 4 && part.every((v) => !v)
    return clear(before) || clear(after)
  }
  for (let i = 0; i < n; i++) {
    for (const line of [modules[i], modules.map((row) => row[i])]) {
      for (let j = 0; j + 7 <= n; j++) if (matches(line, j)) score += 40
    }
  }

  // rule 4: overall dark/light balance
  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
  const ratio = (dark * 100) / (n * n)
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10

  return score
}

export type QRMatrix = {
  size: number
  version: number
  modules: boolean[][]
}

/** Encode `text` as a QR matrix (no quiet zone — add it when rendering). */
export function encodeQR(text: string): QRMatrix {
  const bytes = new TextEncoder().encode(text)
  const version = pickVersion(bytes.length)
  const size = version * 4 + 17
  const codewords = buildCodewords(bytes, version)

  const grid = newGrid(size)
  placeFinder(grid, 0, 0)
  placeFinder(grid, 0, size - 7)
  placeFinder(grid, size - 7, 0)
  for (let i = 8; i < size - 8; i++) {
    setModule(grid, 6, i, i % 2 === 0)
    setModule(grid, i, 6, i % 2 === 0)
  }
  placeAlignment(grid, version)
  reserveFormatAreas(grid, version)
  placeData(grid, codewords)

  let best: boolean[][] | null = null
  let bestScore = Infinity
  for (let pattern = 0; pattern < 8; pattern++) {
    const candidate = applyMask(grid, pattern)
    placeFormatInfo(candidate, size, pattern)
    placeVersionInfo(candidate, size, version)
    const score = penalty(candidate)
    if (score < bestScore) {
      bestScore = score
      best = candidate
    }
  }

  return { size, version, modules: best! }
}

/**
 * Build an SVG path for the dark modules. Rounded "dot" modules read as the
 * ReviewDot mark while staying well inside scanner tolerance.
 */
export function qrPath(matrix: QRMatrix, { radius = 0 }: { radius?: number } = {}): string {
  const parts: string[] = []
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (!matrix.modules[r][c]) continue
      if (radius > 0) {
        parts.push(`M${c + radius},${r}h${1 - 2 * radius}a${radius},${radius} 0 0 1 ${radius},${radius}`)
        parts.push(`v${1 - 2 * radius}a${radius},${radius} 0 0 1 -${radius},${radius}`)
        parts.push(`h-${1 - 2 * radius}a${radius},${radius} 0 0 1 -${radius},-${radius}`)
        parts.push(`v-${1 - 2 * radius}a${radius},${radius} 0 0 1 ${radius},-${radius}z`)
      } else {
        parts.push(`M${c},${r}h1v1h-1z`)
      }
    }
  }
  return parts.join('')
}

/** Standalone SVG markup — used for downloads and printing. */
export function qrSvg(
  text: string,
  { size = 512, margin = 2, dark = '#0A0C0B', light = '#FFFFFF' } = {},
): string {
  const matrix = encodeQR(text)
  const total = matrix.size + margin * 2
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="${light}"/>`,
    `<g transform="translate(${margin},${margin})"><path d="${qrPath(matrix)}" fill="${dark}"/></g>`,
    `</svg>`,
  ].join('')
}
