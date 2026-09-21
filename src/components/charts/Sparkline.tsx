import { scaleLinear, smoothPath } from './chart-utils'

/** Decorative trend line for KPI tiles — the number beside it carries the value. */
export function Sparkline({
  values,
  color = 'var(--color-chart-1)',
  width = 120,
  height = 34,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const x = scaleLinear([0, values.length - 1], [1, width - 1])
  const y = scaleLinear([min, max === min ? max + 1 : max], [height - 3, 3])
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }))
  const line = smoothPath(points)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden className="overflow-visible">
      <path d={`${line} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`} fill={color} opacity="0.08" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
    </svg>
  )
}
