import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Sparkles, Reply, AlertTriangle, Users } from 'lucide-react'
import { seedActivity, randomActivity, type ActivityEvent } from '@/lib/data'
import { useInterval } from '@/lib/hooks'
import { timeAgo } from '@/lib/utils'

const kindMeta = {
  review: { Icon: Star, cls: 'bg-amber-glow/12 text-amber-glow' },
  ai: { Icon: Sparkles, cls: 'bg-aura-400/12 text-aura-400' },
  reply: { Icon: Reply, cls: 'bg-cyan-glow/12 text-cyan-glow' },
  alert: { Icon: AlertTriangle, cls: 'bg-rose-glow/12 text-rose-glow' },
  team: { Icon: Users, cls: 'bg-mint-400/12 text-mint-400' },
}

/** Realtime activity stream — new events flow in every few seconds. */
export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>(seedActivity)
  const [, setTick] = useState(0)

  useInterval(() => {
    setEvents((prev) => [randomActivity(), ...prev].slice(0, 12))
  }, 7000)
  useInterval(() => setTick((t) => t + 1), 30000) // refresh relative timestamps

  return (
    <div className="relative max-h-[360px] space-y-1 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((e) => {
          const { Icon, cls } = kindMeta[e.kind]
          return (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/4"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cls}`}>
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-mist-100">{e.text}</div>
                <div className="truncate text-xs text-mist-500">{e.meta}</div>
              </div>
              <span className="shrink-0 pt-0.5 text-[10px] whitespace-nowrap text-mist-500">
                {timeAgo(e.at)}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
