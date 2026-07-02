import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ProgressRing } from '@/components/ui/ProgressRing'
import type { Dataset } from '@/lib/data'
import { businessProfile } from '@/lib/business'

/** AI Business Health Score: one number a busy owner can act on. */
export function HealthScore({ dataset }: { dataset: Dataset }) {
  const { score, grade, factors } = dataset.health
  const profile = businessProfile(dataset.type)

  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex shrink-0 flex-col items-center gap-1 sm:px-2">
        <ProgressRing
          value={score}
          size={120}
          stroke={9}
          color="var(--color-mint-400)"
          label={`Grade ${grade}`}
        />
        <div className="mt-1 flex items-center gap-1 text-[11px] text-mist-400">
          <Sparkles size={11} className="text-aura-400" /> AI-scored for a {profile.label.toLowerCase()}
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {factors.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="text-mist-300">{f.label}</span>
              <span className="font-display font-semibold text-mist-100">{f.score}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pulse-400 to-mint-400"
                initial={{ width: 0 }}
                whileInView={{ width: `${f.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-0.5 truncate text-[11px] text-mist-500">{f.detail}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
