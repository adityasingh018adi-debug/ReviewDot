import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Sparkles, TrendingUp } from 'lucide-react'
import type { InsightCard } from '@/lib/insights'
import { cn } from '@/lib/utils'

const TONES = {
  opportunity: { icon: Sparkles, class: 'bg-brand-50 text-brand-700' },
  risk: { icon: AlertTriangle, class: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger' },
  trend: { icon: TrendingUp, class: 'bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-info' },
} as const

export function InsightList({ cards, limit }: { cards: InsightCard[]; limit?: number }) {
  const shown = limit ? cards.slice(0, limit) : cards
  return (
    <ul className="space-y-3">
      {shown.map((card) => {
        const tone = TONES[card.kind]
        return (
          <li
            key={card.id}
            className="rounded-2xl border border-line bg-surface p-4 transition-shadow duration-300 hover:shadow-soft"
          >
            <div className="flex items-start gap-3">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', tone.class)}>
                <tone.icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug tracking-tight text-ink">{card.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{card.detail}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                    {card.metric}
                  </span>
                  {card.href ? (
                    <Link
                      to={card.href}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                    >
                      {card.action} <ArrowRight size={13} />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
