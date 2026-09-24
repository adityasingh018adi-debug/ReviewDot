/**
 * A trend line small enough to sit inside a stat tile.
 *
 * Deliberately axis-less and label-less: it shows shape, and the figure beside
 * it carries the value. Drawn as inline SVG rather than through the charting
 * library because a dozen of these on one page is a dozen resize observers for
 * something that never needs to be interactive.
 *
 * `stroke` and `fill` take a CSS colour — pass a token (var(--color-chart-1)),
 * never a literal hex.
 */
export function Sparkline({
  values,
  stroke = 'var(--color-chart-1)',
  filled = true,
  width = 88,
  height = 34,
  className,
}: {
  values: number[]
  stroke?: string
  filled?: boolean
  width?: number
  height?: number
  className?: string
}) {
  if (values.length < 2) return <div style={{ width, height }} className={className} aria-hidden />

  const max = Math.max(...values)
  const min = Math.min(...values)
  // A flat series would divide by zero; draw it down the middle instead.
  const span = max - min || 1
  const step = width / (values.length - 1)
  const pad = 3

  const points = values.map((value, index) => {
    const x = index * step
    const y = height - pad - ((value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const gradient = `spark-${Math.abs(hash(values.join(',') + stroke))}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden
      focusable="false"
      preserveAspectRatio="none"
    >
      {filled ? (
        <>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradient})`} />
        </>
      ) : null}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Stable id per series, so two sparklines never share a gradient. */
function hash(value: string): number {
  let total = 0
  for (let i = 0; i < value.length; i += 1) total = (total * 31 + value.charCodeAt(i)) | 0
  return total
}

/** Vertical bars, for the channel cards. Same rules as above. */
export function BarSpark({
  values,
  color = 'var(--color-chart-1)',
  height = 34,
  className,
}: {
  values: number[]
  color?: string
  height?: number
  className?: string
}) {
  const max = Math.max(...values, 1)
  return (
    <div className={className} style={{ height }} aria-hidden>
      <div className="flex h-full items-end gap-[3px]">
        {values.map((value, index) => (
          <span
            key={index}
            className="w-[5px] rounded-sm"
            style={{
              height: `${Math.max(12, (value / max) * 100)}%`,
              backgroundColor: color,
              opacity: 0.35 + (index / Math.max(values.length - 1, 1)) * 0.65,
            }}
          />
        ))}
      </div>
    </div>
  )
}
