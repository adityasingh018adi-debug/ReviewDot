import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToasts } from '@/store/workspace'

const icons = {
  success: { Icon: CheckCircle2, cls: 'text-mint-400' },
  error: { Icon: AlertCircle, cls: 'text-rose-glow' },
  info: { Icon: Info, cls: 'text-cyan-glow' },
}

export function Toasts() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed right-4 bottom-24 z-[80] flex w-[min(92vw,340px)] flex-col gap-2 md:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const { Icon, cls } = icons[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5 shadow-float"
            >
              <motion.span
                initial={{ scale: 0, rotate: -60 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.1 }}
                className={cls}
              >
                <Icon size={19} />
              </motion.span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-mist-50">{t.title}</div>
                {t.body && <div className="mt-0.5 text-xs text-mist-400">{t.body}</div>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-mist-500 transition-colors hover:text-mist-100"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
