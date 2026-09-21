import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.22em] text-accent', className)}>
      {children}
    </p>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn('max-w-2xl', align === 'center' ? 'mx-auto text-center' : '', className)}
    >
      {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
      <h2 className="text-balance-tight text-[30px] font-semibold leading-[1.12] text-ink sm:text-[40px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base">{description}</p>
      ) : null}
    </motion.div>
  )
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
