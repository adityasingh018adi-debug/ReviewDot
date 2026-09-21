import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({
  children,
  className,
  padded = true,
  hover = false,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-line bg-surface shadow-soft',
        padded && 'p-5 sm:p-6',
        hover && 'transition-all duration-300 hover:shadow-card hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">{children}</p>
  )
}
