import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info' | 'brand'

const TONES: Record<Tone, string> = {
  neutral: 'bg-raised text-muted border-line',
  positive: 'bg-brand-50 text-brand-700 border-brand-100',
  warning: 'bg-[color-mix(in_srgb,var(--color-warn)_12%,transparent)] text-warn border-[color-mix(in_srgb,var(--color-warn)_28%,transparent)]',
  danger: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]',
  info: 'bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-info border-[color-mix(in_srgb,var(--color-info)_25%,transparent)]',
  brand: 'bg-accent text-on-accent border-transparent',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Dot({ tone = 'positive' }: { tone?: 'positive' | 'warning' | 'danger' | 'neutral' }) {
  const color =
    tone === 'positive'
      ? 'bg-brand-400'
      : tone === 'warning'
        ? 'bg-warn'
        : tone === 'danger'
          ? 'bg-danger'
          : 'bg-faint'
  return <span className={cn('inline-block size-1.5 rounded-full', color)} />
}
