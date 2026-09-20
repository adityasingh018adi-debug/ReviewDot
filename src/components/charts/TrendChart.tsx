import { useMemo, useState } from 'react'
import { formatDayShort, formatNumber } from '@/lib/utils'
import { niceMax, scaleLinear, smoothPath, ticksFor } from './chart-utils'

export type TrendSeries = {
  key: string
  label: string
  color: string
  values: number[]
  /** Area fill is reserved for the primary series. */
  fill?: boolean
}

type Props = {
  labels: string[]
  series: TrendSeries[]
  height?: number
  valueFormat?: (value: number) => string
  /** Labels are dates by default; pass a formatter for other scales. */
  labelFormat?: (label: string) => string
  /** Pins the axis ceiling — ratings, for example, always top out at 5. */
  max?: number
  caption?: string
}

const PAD = { top: 16, right: 12, bottom: 26, left: 40 }

/**
 * Line/area chart with a crosshair tooltip. Two series get a legend and direct
 * end labels; a screen-reader table carries the same numbers.
 */
export function TrendChart({
  labels,
  series,
  height = 260,
  valueFormat = formatNumber,
  labelFormat = formatDayShort,
  max: fixedMax,
  caption,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 720
  const max = useMemo(
    () => fixedMax ?? niceMax(Math.max(1, ...series.flatMap((s) => s.values))),
    [series, fixedMax],
  )
  const x = scaleLinear([0, Math.max(1, labels.length - 1)], [PAD.left, width - PAD.right])
  const y = scaleLinear([0, max], [height - PAD.bottom, PAD.top])

  const paths = series.map((s) => {
    const points = s.values.map((value, index) => ({ x: x(index), y: y(value) }))
    const line = smoothPath(points)
    const area = points.length
      ? `${line} L${points[points.length - 1].x},${y(0)} L${points[0].x},${y(0)} Z`
      : ''
    return { ...s, points, line, area }
  })

  const labelEvery = Math.max(1, Math.ceil(labels.length / 7))
  const active = hover ?? null

  return (
    <figure className="m-0">
      {series.length > 1 ? (
        <figcaption className="mb-3 flex flex-wrap items-center gap-4">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-2 text-[12px] text-muted">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      ) : null}

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full touch-none"
          style={{ height }}
          role="img"
          aria-label={caption ?? `${series.map((s) => s.label).join(' and ')} over time`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const ratio = (event.clientX - rect.left) / rect.width
            const index = Math.round(ratio * width - PAD.left) / ((width - PAD.left - PAD.right) / Math.max(1, labels.length - 1))
            setHover(Math.max(0, Math.min(labels.length - 1, Math.round(index))))
          }}
        >
          <defs>
            {paths.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {ticksFor(max).map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--color-grid)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 10}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-faint"
                style={{ fontSize: 11 }}
              >
                {valueFormat(tick)}
              </text>
            </g>
          ))}

          {paths.map((s) =>
            s.fill ? <path key={`area-${s.key}`} d={s.area} fill={`url(#fill-${s.key})`} /> : null,
          )}
          {paths.map((s) => (
            <path
              key={`line-${s.key}`}
              d={s.line}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {labels.map((label, index) =>
            index % labelEvery === 0 || index === labels.length - 1 ? (
              <text
                key={label}
                x={x(index)}
                y={height - 6}
                textAnchor="middle"
                className="fill-faint"
                style={{ fontSize: 11 }}
              >
                {labelFormat(label)}
              </text>
            ) : null,
          )}

          {active !== null ? (
            <g>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top - 6}
                y2={height - PAD.bottom}
                stroke="var(--color-line-strong)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {paths.map((s) => (
                <circle
                  key={`dot-${s.key}`}
                  cx={x(active)}
                  cy={y(s.values[active] ?? 0)}
                  r="5"
                  fill={s.color}
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
              ))}
            </g>
          ) : null}
        </svg>

        {active !== null ? (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 -translate-x-1/2 rounded-2xl border border-line bg-surface px-3 py-2 shadow-card"
            style={{ left: `${((x(active) - PAD.left / 2) / width) * 100}%` }}
          >
            <p className="text-[11px] font-medium text-muted">{labelFormat(labels[active])}</p>
            {series.map((s) => (
              <p key={s.key} className="mt-1 flex items-center gap-2 text-[13px] text-ink">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted">{s.label}</span>
                <span className="ml-auto font-semibold">{valueFormat(s.values[active] ?? 0)}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>{caption ?? 'Trend data'}</caption>
        <thead>
          <tr>
            <th>Date</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, index) => (
            <tr key={label}>
              <td>{label}</td>
              {series.map((s) => (
                <td key={s.key}>{s.values[index]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
