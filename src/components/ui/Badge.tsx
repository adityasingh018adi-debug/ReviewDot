import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'positive' | 'neutral' | 'negative' | 'info' | 'accent' | 'warning'

const tones: Record<Tone, string> = {
  positive: 'bg-mint-400/12 text-mint-400 border-mint-400/25',
  neutral: 'bg-white/6 text-mist-300 border-white/12',
  negative: 'bg-rose-glow/12 text-rose-glow border-rose-glow/25',
  info: 'bg-cyan-glow/12 text-cyan-glow border-cyan-glow/25',
  accent: 'bg-pulse-500/15 text-pulse-300 border-pulse-400/30',
  warning: 'bg-amber-glow/12 text-amber-glow border-amber-glow/25',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        'transition-transform duration-200 hover:scale-105',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
