import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-xl bg-accent', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" className="fill-on-accent" />
        <rect x="14" y="3" width="7" height="7" rx="2" className="fill-on-accent" opacity="0.55" />
        <rect x="3" y="14" width="7" height="7" rx="2" className="fill-on-accent" opacity="0.55" />
        <circle cx="17.5" cy="17.5" r="3.5" className="fill-on-accent" />
      </svg>
    </span>
  )
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[19px] font-semibold tracking-tight text-ink">ReviewDot</span>
    </Link>
  )
}
