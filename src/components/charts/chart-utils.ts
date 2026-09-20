/** Shared geometry helpers for the hand-rolled SVG charts. */

export type Point = { x: number; y: number }

export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0)
}

/** Catmull-Rom → cubic Bézier, so lines stay smooth without overshooting. */
export function smoothPath(points: Point[]): string {
  if (points.length < 2) return points.length ? `M${points[0].x},${points[0].y}` : ''
  const parts = [`M${points[0].x},${points[0].y}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    parts.push(`C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`)
  }
  return parts.join(' ')
}

/** "Nice" axis ceiling so gridlines land on round numbers. */
export function niceMax(value: number, ticks = 4): number {
  if (value <= 0) return ticks
  const rough = value / ticks
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude
  const step = [1, 2, 2.5, 3, 4, 5, 10].find((candidate) => normalized <= candidate) ?? 10
  return step * magnitude * ticks
}

export function ticksFor(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, index) => (max / count) * index)
}
