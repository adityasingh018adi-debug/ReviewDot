import { useMemo, useState, type PointerEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCompact } from '@/lib/utils'

interface Series {
  name: string
  color: string
  values: number[]
}

interface AreaChartProps {
  labels: string[]
  series: Series[]
  height?: number
}

const W = 720
const PAD = { top: 16, right: 12, bottom: 26, left: 40 }

function buildPath(values: number[], max: number, height: number) {
  const iw = W - PAD.left - PAD.right
  const ih = height - PAD.top - PAD.bottom
  const pts = values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1)) * iw,
    y: PAD.top + ih - (v / max) * ih,
  }))
  // smooth cubic path through the points
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const cx = (prev.x + cur.x) / 2
    d += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`
  }
  return { d, pts }
}

/** Smooth animated area chart with hover crosshair and tooltip. */
export function AreaChart({ labels, series, height = 260 }: AreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const max = useMemo(() => Math.max(...series.flatMap((s) => s.values)) * 1.15, [series])

  const paths = useMemo(
    () => series.map((s) => ({ ...s, ...buildPath(s.values, max, height) })),
    [series, max, height],
  )
  const ih = height - PAD.top - PAD.bottom
  const iw = W - PAD.left - PAD.right

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((x - PAD.left) / iw) * (labels.length - 1))
    setHoverIdx(Math.max(0, Math.min(labels.length - 1, idx)))
  }

  const hoverX = hoverIdx !== null ? PAD.left + (hoverIdx / (labels.length - 1)) * iw : 0

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Line chart of ${series.map((s) => s.name).join(' and ')} across ${labels.length} periods. Latest values: ${series.map((s) => `${s.name} ${s.values[s.values.length - 1].toLocaleString()}`).join(', ')}.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <defs>
          {paths.map((p) => (
            <linearGradient key={p.name} id={`fill-${p.name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={p.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + ih * (1 - f)}
              y2={PAD.top + ih * (1 - f)}
              stroke="rgb(255 255 255 / 0.06)"
              strokeDasharray="3 5"
            />
            <text
              x={PAD.left - 8}
              y={PAD.top + ih * (1 - f) + 4}
              textAnchor="end"
              className="fill-mist-500 text-[10px]"
            >
              {formatCompact(max * f)}
            </text>
          </g>
        ))}

        {labels.map((l, i) =>
          i % 2 === 0 ? (
            <text
              key={l}
              x={PAD.left + (i / (labels.length - 1)) * iw}
              y={height - 8}
              textAnchor="middle"
              className="fill-mist-500 text-[10px]"
            >
              {l}
            </text>
          ) : null,
        )}

        {paths.map((p, si) => (
          <g key={p.name}>
            <motion.path
              d={`${p.d} L ${W - PAD.right} ${PAD.top + ih} L ${PAD.left} ${PAD.top + ih} Z`}
              fill={`url(#fill-${p.name})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + si * 0.2, duration: 0.8 }}
            />
            <motion.path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: si * 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: `drop-shadow(0 0 5px ${p.color}66)` }}
            />
          </g>
        ))}

        {hoverIdx !== null && (
          <g>
            <line x1={hoverX} x2={hoverX} y1={PAD.top} y2={PAD.top + ih} stroke="rgb(255 255 255 / 0.2)" />
            {paths.map((p) => (
              <circle
                key={p.name}
                cx={p.pts[hoverIdx].x}
                cy={p.pts[hoverIdx].y}
                r={4.5}
                fill={p.color}
                stroke="#0a0c14"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>

      <AnimatePresence>
        {hoverIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="glass-strong pointer-events-none absolute top-2 z-10 rounded-xl px-3 py-2 text-xs shadow-panel"
            style={{ left: `clamp(0%, ${(hoverX / W) * 100}% - 60px, calc(100% - 130px))` }}
          >
            <div className="mb-1 font-semibold text-mist-100">{labels[hoverIdx]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-mist-300">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}:{' '}
                <span className="font-medium text-mist-50">{s.values[hoverIdx].toLocaleString()}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
