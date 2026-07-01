import { useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { Globe2, TrendingUp, Target, Clock3, Gauge } from 'lucide-react'
import { trendSeries, regions, platformVolumes, heatmapData } from '@/lib/data'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { Heatmap } from '@/components/charts/Heatmap'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { TiltCard } from '@/components/ui/TiltCard'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { cn } from '@/lib/utils'

const ranges = ['7D', '30D', '90D', '12M'] as const
type Range = (typeof ranges)[number]

const scores = [
  { label: 'Reply quality', value: 92, color: 'var(--color-pulse-400)' },
  { label: 'SLA adherence', value: 88, color: 'var(--color-cyan-glow)' },
  { label: 'Coverage', value: 96, color: 'var(--color-mint-400)' },
]

/** Scales a series to fake different time ranges for the demo. */
function scaleSeries(values: number[], range: Range) {
  const factor = range === '7D' ? 0.08 : range === '30D' ? 0.33 : range === '90D' ? 0.75 : 1
  return values.map((v, i) => Math.round(v * factor * (1 + Math.sin(i * 1.7) * 0.08)))
}

export function Analytics() {
  const [range, setRange] = useState<Range>('12M')

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-mist-400">
            Drill into reputation performance across every dimension.
          </p>
        </div>

        <LayoutGroup id="range">
          <div className="glass flex gap-1 rounded-xl p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  range === r ? 'text-mist-50' : 'text-mist-400 hover:text-mist-100',
                )}
              >
                {range === r && (
                  <motion.span
                    layoutId="range-pill"
                    className="absolute inset-0 rounded-lg bg-pulse-500/25 shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{r}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel
          className="p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-pulse-300">
              <TrendingUp size={15} />
            </span>
            <h3 className="font-display text-sm font-semibold">Volume trend · {range}</h3>
          </div>
          <AreaChart
            key={range}
            labels={trendSeries.labels}
            series={[
              {
                name: 'Reviews',
                color: 'var(--color-pulse-400)',
                values: scaleSeries(trendSeries.reviews, range),
              },
              {
                name: 'Responses',
                color: 'var(--color-cyan-glow)',
                values: scaleSeries(trendSeries.responses, range),
              },
            ]}
          />
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-mint-400">
              <Gauge size={15} />
            </span>
            <h3 className="font-display text-sm font-semibold">Quality scores</h3>
          </div>
          <div className="flex flex-wrap items-center justify-around gap-4 py-3">
            {scores.map((s) => (
              <ProgressRing key={s.label} value={s.value} color={s.color} label={s.label} size={96} />
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-white/8 bg-white/3 p-3 text-xs leading-relaxed text-mist-400">
            Composite quality is <span className="font-semibold text-mist-100">A+</span>. Reply quality rose 4
            points after enabling tone-matched AI drafts.
          </div>
        </GlassPanel>

        <TiltCard maxTilt={4} className="lg:col-span-1">
          <GlassPanel
            className="h-full p-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-cyan-glow">
                <Globe2 size={15} />
              </span>
              <h3 className="font-display text-sm font-semibold">Geographic distribution</h3>
            </div>
            <div className="space-y-3.5">
              {regions.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="text-mist-300">{r.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-mint-400">↑ {r.trend}%</span>
                      <span className="font-display font-semibold text-mist-100">{r.value}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-glow/80 to-pulse-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(r.value / regions[0].value) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </TiltCard>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-aura-400">
              <Target size={15} />
            </span>
            <h3 className="font-display text-sm font-semibold">Platform share</h3>
          </div>
          <BarChart data={platformVolumes} color="var(--color-aura-400)" />
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-amber-glow">
              <Clock3 size={15} />
            </span>
            <h3 className="font-display text-sm font-semibold">Median response time</h3>
          </div>
          <div className="grid h-[calc(100%-3rem)] place-items-center py-4 text-center">
            <div>
              <div className="font-display text-5xl font-bold text-gradient">
                <AnimatedNumber value={2.4} decimals={1} suffix="h" />
              </div>
              <div className="mt-2 text-xs text-mist-400">down from 9.1h before AI drafts</div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-mint-400/10 px-3 py-1 text-xs font-semibold text-mint-400">
                <TrendingUp size={12} /> 74% faster
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel
          className="p-5 lg:col-span-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-pulse-300">
              <Clock3 size={15} />
            </span>
            <h3 className="font-display text-sm font-semibold">Arrival heatmap · day × hour</h3>
          </div>
          <Heatmap data={heatmapData} />
        </GlassPanel>
      </div>
    </div>
  )
}
