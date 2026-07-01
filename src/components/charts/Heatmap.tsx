import { useState } from 'react'
import { motion } from 'framer-motion'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Review-volume heatmap by day × hour with staggered reveal. */
export function Heatmap({ data }: { data: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null)
  const max = Math.max(...data.flat()) || 1

  return (
    <div
      className="space-y-1.5"
      role="img"
      aria-label="Heatmap of review volume by day of week and hour of day. Weekday business hours are busiest, peaking around midday."
    >
      {data.map((row, d) => (
        <div key={d} className="flex items-center gap-1.5">
          <span className="w-8 shrink-0 text-[10px] text-mist-500">{DAYS[d]}</span>
          <div className="grid flex-1 grid-cols-24 gap-[3px]">
            {row.map((v, h) => {
              const intensity = v / max
              return (
                <motion.div
                  key={h}
                  initial={{ opacity: 0, scale: 0.4 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (d * 24 + h) * 0.0035, duration: 0.3 }}
                  onPointerEnter={() => setHover({ d, h })}
                  onPointerLeave={() => setHover(null)}
                  className="aspect-square cursor-pointer rounded-[3px] transition-transform hover:scale-125"
                  style={{
                    background:
                      intensity === 0
                        ? 'rgb(255 255 255 / 0.04)'
                        : `rgb(97 114 243 / ${0.15 + intensity * 0.85})`,
                    boxShadow: intensity > 0.7 ? '0 0 6px rgb(97 114 243 / 0.6)' : undefined,
                  }}
                />
              )
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pl-9 pt-1 text-[10px] text-mist-500">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
      <div className="h-4 pt-1 text-[11px] text-mist-400">
        {hover
          ? `${DAYS[hover.d]} ${hover.h}:00 — ${data[hover.d][hover.h]} reviews`
          : 'Hover a cell for details'}
      </div>
    </div>
  )
}
