import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Sparkline } from '@/components/charts/Sparkline'
import type { KpiSeed } from '@/lib/data'

const accents = [
  'var(--color-pulse-400)',
  'var(--color-cyan-glow)',
  'var(--color-mint-400)',
  'var(--color-aura-400)',
]

export function KpiCard({ kpi, index, live }: { kpi: KpiSeed; index: number; live: number }) {
  const up = kpi.delta >= 0
  const accent = accents[index % accents.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="glass group relative overflow-hidden rounded-2xl p-5 shadow-panel transition-colors duration-300 hover:border-white/20"
    >
      <div
        className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium tracking-wide text-mist-400 uppercase">{kpi.label}</div>
          <div className="font-display mt-2 text-3xl font-bold text-mist-50">
            <AnimatedNumber
              value={live}
              decimals={kpi.decimals ?? 0}
              prefix={kpi.prefix}
              suffix={kpi.suffix}
            />
          </div>
        </div>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
          style={{
            color: up ? 'var(--color-mint-400)' : 'var(--color-rose-glow)',
            background: up ? 'rgb(67 222 160 / 0.1)' : 'rgb(251 109 136 / 0.1)',
          }}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(kpi.delta)}%
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-[11px] text-mist-500">vs. last month</span>
        <Sparkline values={kpi.spark} color={accent} width={110} height={34} />
      </div>
    </motion.div>
  )
}
