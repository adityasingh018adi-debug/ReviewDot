import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { cn } from '@/lib/utils'

/**
 * One headline figure.
 *
 * The trend is rendered from a real comparison against the previous window, and
 * the sparkline from the real daily series — neither is decorative. A tile with
 * nothing behind it shows a dash rather than a zero, because zero is a
 * measurement and "no data yet" is not.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  trend,
  series,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'brand' | 'blue' | 'amber' | 'green'
  /** Fractional change against the previous window, e.g. 0.128 for +12.8%. */
  trend?: number | null
  series?: number[]
}) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700',
    blue: 'bg-sky-100 text-sky-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-emerald-100 text-emerald-700',
  } as const

  const up = (trend ?? 0) >= 0
  const Arrow = up ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tones[tone])}>
          <Icon size={17} strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-muted">{label}</p>
      </div>

      <p className="mt-2.5 font-display text-[26px] font-bold leading-none tracking-tight text-ink">
        {value}
      </p>

      <div className="mt-2 flex items-end justify-between gap-2">
        {trend === null || trend === undefined ? (
          <span />
        ) : (
          <p
            className={cn(
              'flex items-center gap-1 text-[12px] font-semibold',
              up ? 'text-emerald-600' : 'text-danger',
            )}
          >
            <Arrow size={13} strokeWidth={2.4} />
            {formatTrend(trend)}
          </p>
        )}
        {series && series.length > 1 ? (
          <Sparkline values={series} stroke="var(--color-chart-1)" width={72} height={26} className="shrink-0" />
        ) : null}
      </div>
    </div>
  )
}

function formatTrend(value: number): string {
  const pct = Math.abs(value * 100)
  return `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`
}
