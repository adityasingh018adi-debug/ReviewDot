import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Sparkline } from '@/components/charts/Sparkline'
import { useCountUp } from '@/lib/hooks'
import { cn, formatTrend } from '@/lib/utils'

export function KpiCard({
  label,
  value,
  numeric,
  format,
  trend,
  icon: Icon,
  series,
  invertTrend = false,
}: {
  label: string
  value?: string
  numeric?: number
  format?: (value: number) => string
  trend: number
  icon: LucideIcon
  series?: number[]
  invertTrend?: boolean
}) {
  const animated = useCountUp(numeric ?? 0)
  const positive = invertTrend ? trend <= 0 : trend >= 0
  const display = value ?? (format ? format(animated) : Math.round(animated).toString())

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft transition-shadow duration-300 hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-muted">{label}</p>
        <span className="grid size-8 place-items-center rounded-xl bg-raised text-muted">
          <Icon size={15} strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-3 font-display text-[30px] font-semibold leading-none tracking-tight tabular-nums text-ink">
        {display}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-medium',
            positive ? 'text-brand-600' : 'text-danger',
          )}
        >
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {formatTrend(trend)}
          <span className="font-normal text-faint">vs prev.</span>
        </span>
        {series && series.length > 1 ? (
          <Sparkline
            values={series}
            width={92}
            color={positive ? 'var(--color-chart-1)' : 'var(--color-danger)'}
          />
        ) : null}
      </div>
    </div>
  )
}
