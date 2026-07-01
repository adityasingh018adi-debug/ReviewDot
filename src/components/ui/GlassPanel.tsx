import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  hover?: boolean
}

/** Frosted floating panel — the base surface of the interface. */
export function GlassPanel({ className, hover = false, children, ...props }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        'glass rounded-2xl shadow-panel',
        hover && 'transition-[border-color,box-shadow] duration-300 hover:border-white/20 hover:shadow-glow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
