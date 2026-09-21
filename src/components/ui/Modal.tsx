import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEscape } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  useEscape(onClose)
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-coal-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={cn(
              'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-pop thin-scroll sm:rounded-3xl',
              size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
                {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-xl p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
            {footer ? <div className="border-t border-line p-5 sm:p-6">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
