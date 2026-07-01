import { motion } from 'framer-motion'
import { formatCompact } from '@/lib/utils'

interface BarChartProps {
  data: Array<{ name: string; value: number }>
  color?: string
}

/** Horizontal animated bar chart with staggered draw-in. */
export function BarChart({ data, color = 'var(--color-pulse-400)' }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="space-y-3.5">
      {data.map((d, i) => (
        <div key={d.name} className="group">
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="text-mist-300 transition-colors group-hover:text-mist-50">{d.name}</span>
            <span className="font-display font-semibold text-mist-100">{formatCompact(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/6">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${color}, var(--color-aura-400))`,
                boxShadow: `0 0 10px ${color}55`,
              }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
