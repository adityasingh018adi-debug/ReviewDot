import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Realistic phone shell used for the customer-journey mockups. */
export function PhoneFrame({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative w-[264px] rounded-[38px] border border-line-strong bg-coal-900 p-2 shadow-float">
        <div className="relative h-[520px] overflow-hidden rounded-[30px] bg-surface">
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-coal-900" />
          <div className="flex h-full min-h-0 flex-col overflow-hidden pt-8">{children}</div>
        </div>
      </div>
      {label ? <p className="text-[12px] font-medium text-muted">{label}</p> : null}
    </div>
  )
}
