import { motion } from 'framer-motion'
import { Lightbulb, ShieldAlert, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import type { Dataset } from '@/lib/data'
import { useToasts } from '@/store/workspace'
import { Badge } from '@/components/ui/Badge'

const toneMeta = {
  opportunity: {
    Icon: Lightbulb,
    label: 'Opportunity',
    badge: 'positive' as const,
    bar: 'rgb(67 222 160 / 0.8)',
  },
  risk: { Icon: ShieldAlert, label: 'Risk', badge: 'negative' as const, bar: 'rgb(251 109 136 / 0.8)' },
  trend: { Icon: TrendingUp, label: 'Trend', badge: 'info' as const, bar: 'rgb(76 224 224 / 0.8)' },
}

/** AI action suggestions tailored to the business type, with one-click actions. */
export function ActionSuggestions({ dataset }: { dataset: Dataset }) {
  const pushToast = useToasts((s) => s.push)

  return (
    <div className="space-y-3">
      {dataset.actions.map((ins, i) => {
        const meta = toneMeta[ins.tone]
        const Icon = meta.Icon
        return (
          <motion.div
            key={ins.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="group relative overflow-hidden rounded-2xl border border-edge bg-white/3 p-4 transition-colors hover:border-white/16"
          >
            <div className="absolute inset-y-0 left-0 w-1 rounded-full" style={{ background: meta.bar }} />
            <div className="relative flex items-start gap-3 pl-2">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-edge bg-white/5">
                <Icon size={16} className="text-mist-100" />
              </span>
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
                    pushToast({ tone: 'success', title: ins.action, body: 'Added to your action plan.' })
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
