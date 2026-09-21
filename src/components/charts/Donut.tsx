import { useState } from 'react'
import { formatNumber, formatPercent } from '@/lib/utils'

export type Slice = { label: string; value: number; color: string }

/**
 * Ordinal donut (5★ → 1★ and similar). The centre carries the headline number;
 * slices are separated by a surface-coloured gap rather than an outline.
 */
export function Donut({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: Slice[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  // pre-compute each arc so the render pass stays free of mutation
  const arcs = data.reduce<{ slice: Slice; dash: number; offset: number }[]>((acc, slice) => {
    const dash = (slice.value / total) * circumference
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
    acc.push({ slice, dash, offset })
    return acc
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Distribution">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {arcs.map(({ slice, dash, offset }, index) => (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={hover === index ? thickness + 4 : thickness}
                strokeDasharray={`${Math.max(0, dash - 2)} ${circumference - dash + 2}`}
                strokeDashoffset={-offset}
                className="transition-all duration-200"
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink">
              {hover !== null ? formatPercent(data[hover].value / total, 0) : centerValue}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {hover !== null ? data[hover].label : centerLabel}
            </p>
          </div>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2">
        {data.map((slice, index) => (
          <li
            key={slice.label}
            className="flex items-center gap-2.5 text-[12px]"
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
            <span className="truncate text-ink-soft">{slice.label}</span>
            <span className="ml-auto shrink-0 tabular-nums text-muted">{formatNumber(slice.value)}</span>
            <span className="w-9 shrink-0 text-right font-medium tabular-nums text-ink">
              {formatPercent(slice.value / total, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
