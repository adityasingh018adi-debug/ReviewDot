import { useState } from 'react'
import { motion } from 'framer-motion'

interface Slice {
  name: string
  value: number
  color: string
}

/** Animated donut with interactive slice highlighting. */
export function DonutChart({ data, size = 190 }: { data: Slice[]; size?: number }) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.reduce((a, b) => a + b.value, 0)
  const stroke = 20
  const r = (size - stroke) / 2 - 6
  const c = 2 * Math.PI * r

  let offset = 0
  const slices = data.map((d) => {
    const frac = d.value / total
    const s = { ...d, frac, start: offset }
    offset += frac
    return s
  })

  // when idle, spotlight the dominant slice
  const dominant = data.reduce((a, b) => (b.value > a.value ? b : a), data[0])
  const shown = active !== null ? data[active] : dominant

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {slices.map((s, i) => (
            <motion.circle
              key={s.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={active === i ? stroke + 5 : stroke}
              strokeDasharray={`${s.frac * c - 4} ${c - s.frac * c + 4}`}
              strokeDashoffset={-s.start * c}
              strokeLinecap="round"
              initial={{ opacity: 0, strokeDasharray: `0 ${c}` }}
              whileInView={{ opacity: 1, strokeDasharray: `${s.frac * c - 4} ${c - s.frac * c + 4}` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              className="cursor-pointer transition-[stroke-width] duration-200"
              style={{ filter: active === i ? `drop-shadow(0 0 8px ${s.color})` : undefined }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <motion.div
              key={shown.name}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl font-bold text-mist-50"
            >
              {shown.value}%
            </motion.div>
            <div className="text-[10px] uppercase tracking-wider text-mist-400">{shown.name}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((d, i) => (
          <button
            key={d.name}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-white/5"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}88` }} />
            <span className="flex-1 text-mist-300">{d.name}</span>
            <span className="font-display font-semibold text-mist-100">{d.value}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}
