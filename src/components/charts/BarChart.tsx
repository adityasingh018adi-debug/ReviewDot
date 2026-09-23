'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/utils'
import { niceMax, scaleLinear } from './chart-utils'

export type Bar = { label: string; value: number; hint?: string }

/** Vertical bars, one hue — bar length already encodes the value. */
export function BarChart({
  data,
  height = 240,
  valueFormat = formatNumber,
  caption,
  color = 'var(--color-chart-1)',
}: {
  data: Bar[]
  height?: number
  valueFormat?: (value: number) => string
  caption?: string
  color?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 720
  const pad = { top: 18, right: 8, bottom: 30, left: 40 }
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)))
  const y = scaleLinear([0, max], [height - pad.bottom, pad.top])
  const slot = (width - pad.left - pad.right) / Math.max(1, data.length)
  const barWidth = Math.min(46, slot - 10)

  return (
    <figure className="m-0">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ height }} className="w-full" role="img" aria-label={caption}>
          {[0, 0.25, 0.5, 0.75, 1].map((step) => (
            <line
              key={step}
              x1={pad.left}
              x2={width - pad.right}
              y1={y(max * step)}
              y2={y(max * step)}
              stroke="var(--color-grid)"
              strokeWidth="1"
            />
          ))}
          {[0, 0.5, 1].map((step) => (
            <text
              key={step}
              x={pad.left - 10}
              y={y(max * step) + 4}
              textAnchor="end"
              className="fill-faint"
              style={{ fontSize: 11 }}
            >
              {valueFormat(max * step)}
            </text>
          ))}

          {data.map((bar, index) => {
            const x = pad.left + slot * index + (slot - barWidth) / 2
            const barHeight = Math.max(2, y(0) - y(bar.value))
            return (
              <g
                key={bar.label}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                className="cursor-default"
              >
                <rect x={x - 5} y={pad.top} width={barWidth + 10} height={height - pad.bottom - pad.top} fill="transparent" />
                <rect
                  x={x}
                  y={y(bar.value)}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={color}
                  opacity={hover === null || hover === index ? 1 : 0.45}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-muted"
                  style={{ fontSize: 11 }}
                >
                  {bar.label}
                </text>
              </g>
            )
          })}
        </svg>

        {hover !== null ? (
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-2xl border border-line bg-surface px-3 py-2 text-[13px] shadow-card">
            <span className="font-medium text-ink">{data[hover].label}</span>
            <span className="ml-3 font-semibold text-ink">{valueFormat(data[hover].value)}</span>
            {data[hover].hint ? <p className="mt-0.5 text-[11px] text-muted">{data[hover].hint}</p> : null}
          </div>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>{caption ?? 'Chart data'}</caption>
        <tbody>
          {data.map((bar) => (
            <tr key={bar.label}>
              <th scope="row">{bar.label}</th>
              <td>{bar.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** Horizontal ranked bars — better for long category names. */
export function RankedBars({
  data,
  valueFormat = formatNumber,
  color = 'var(--color-chart-1)',
  caption,
}: {
  data: Bar[]
  valueFormat?: (value: number) => string
  color?: string
  caption?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-3" role="group" aria-label={caption}>
      {data.map((bar) => (
        <div key={bar.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] font-medium text-ink">{bar.label}</span>
              {bar.hint ? <span className="shrink-0 text-[11px] text-faint">{bar.hint}</span> : null}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(3, (bar.value / max) * 100)}%`, background: color }}
              />
            </div>
          </div>
          <span className="text-[13px] font-semibold tabular-nums text-ink">{valueFormat(bar.value)}</span>
        </div>
      ))}
    </div>
  )
}
