import { motion } from 'framer-motion'
import { Lightbulb, ShieldAlert, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { insights } from '@/lib/data'
import { useToasts } from '@/store/workspace'
import { Badge } from '@/components/ui/Badge'

const toneMeta = {
  opportunity: {
    Icon: Lightbulb,
    label: 'Opportunity',
    badge: 'positive' as const,
    glow: 'rgb(67 222 160 / 0.12)',
  },
  risk: { Icon: ShieldAlert, label: 'Risk', badge: 'negative' as const, glow: 'rgb(251 109 136 / 0.12)' },
  trend: { Icon: TrendingUp, label: 'Trend', badge: 'info' as const, glow: 'rgb(76 224 224 / 0.12)' },
}

/** AI-generated insights with animated emphasis and one-click actions. */
export function InsightCards() {
  const pushToast = useToasts((s) => s.push)

  return (
    <div className="space-y-3">
      {insights.map((ins, i) => {
        const meta = toneMeta[ins.tone]
        const Icon = meta.Icon
        return (
          <motion.div
            key={ins.id}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 260, damping: 26 }}
            whileHover={{ x: 4 }}
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-4 transition-colors hover:border-white/16"
          >
            <div
              className="absolute inset-y-0 left-0 w-1 rounded-full transition-all duration-300 group-hover:w-1.5"
              style={{ background: meta.glow.replace('0.12', '0.8') }}
            />
            <div
              className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl"
              style={{ background: meta.glow }}
            />

            <div className="relative flex items-start gap-3 pl-2">
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5"
              >
                <Icon size={16} className="text-mist-100" />
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meta.badge}>{meta.label}</Badge>
                  <span className="flex items-center gap-1 text-[10px] text-mist-500">
                    <Sparkles size={10} /> {ins.confidence}% confidence
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm font-semibold text-mist-50">{ins.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-mist-400">{ins.body}</p>
                <button
                  onClick={() =>
                    pushToast({ tone: 'success', title: ins.action, body: 'Action queued — Aria is on it.' })
                  }
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-pulse-300 transition-all hover:gap-2.5 hover:text-pulse-400"
                >
                  {ins.action} <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
