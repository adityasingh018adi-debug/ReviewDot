'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  CreditCard,
  Crown,
  LayoutDashboard,
  MessageSquare,
  MessageSquareWarning,
  Package,
  QrCode,
  Radio,
  Settings,
  Sparkles,
  Star,
  Users,
  UsersRound,
} from 'lucide-react'
import { WorkspaceCard } from './WorkspaceCard'
import { cn } from '@/lib/utils'

/**
 * Dashboard navigation.
 *
 * Grouped rather than one flat list: ten-odd destinations read as a wall
 * otherwise, and the groups say what each one is for — what customers are
 * saying, where they are sent, and what only an owner touches.
 *
 * NAV_ITEMS is the same set flattened, for anything that needs the destinations
 * without the grouping. Every href here must resolve: an e2e test opens each
 * dashboard page and follows every internal link on it, which is what caught two
 * dead ones before.
 */

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Match this href exactly rather than by prefix — only /app needs it. */
  end?: boolean
  badge?: string
}

export const NAV_SECTIONS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
      { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/app/inbox', label: 'Reviews', icon: MessageSquare },
      { href: '/app/feedback', label: 'Feedback', icon: MessageSquareWarning },
      { href: '/app/insights', label: 'AI insights', icon: Sparkles, badge: 'New' },
    ],
  },
  {
    label: 'Review channels',
    items: [{ href: '/app/channels', label: 'Channels', icon: Radio }],
  },
  {
    label: 'Manage',
    items: [
      { href: '/app/campaigns', label: 'QR studio', icon: QrCode },
      { href: '/app/outlets', label: 'Outlets', icon: Building2 },
      { href: '/app/products', label: 'Products', icon: Package },
      { href: '/app/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/app/team', label: 'Team', icon: UsersRound },
      { href: '/app/billing', label: 'Billing', icon: CreditCard },
      { href: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items)

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r border-line bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
          <Star size={18} strokeWidth={2.4} fill="currentColor" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-bold leading-none tracking-tight text-ink">
            Review<span className="text-accent">Dot</span>
          </p>
          <p className="mt-1 text-[11px] leading-tight text-faint">Customer reviews made simple</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <WorkspaceCard />
      </div>

      <nav className="thin-scroll flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label ?? `main-${index}`} className="space-y-0.5">
            {section.label ? (
              <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                {section.label}
              </p>
            ) : null}
            {section.items.map((item) => {
              const active = item.end
                ? pathname === item.href
                : Boolean(pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  /*
                   * Nine links, prefetched together on every dashboard page
                   * load, are nine more requests through middleware carrying
                   * the same refresh token. When the access token is at its
                   * expiry they all try to rotate it at once, one wins and the
                   * rest are told the token was already used. Navigation stays
                   * instant without this — these are server-rendered pages
                   * behind a spinner either way.
                   */
                  prefetch={false}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors duration-150',
                    active
                      // Dark mode tints rather than fills: a solid purple bar
                      // repeated down the rail is most of the purple on screen,
                      // and it is the least informative place to spend it.
                      ? 'bg-accent text-on-accent shadow-soft dark:bg-accent-soft dark:text-accent-text dark:shadow-none'
                      : 'text-muted hover:bg-raised hover:text-ink',
                  )}
                >
                  <item.icon size={17} strokeWidth={1.9} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        active ? 'bg-white/20 text-on-accent' : 'bg-accent-soft text-accent',
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <UpgradeCard />
    </div>
  )
}

function UpgradeCard() {
  return (
    <div className="accent-gradient m-4 mt-0 rounded-2xl p-4 text-white">
      <p className="flex items-center gap-2 text-[13px] font-semibold">
        <Crown size={15} strokeWidth={2.2} /> Upgrade your plan
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/75">
        More outlets, more QR codes and advanced analytics.
      </p>
      <Link
        href="/app/billing"
        className="mt-3 block rounded-xl bg-white/15 px-3 py-2 text-center text-[12px] font-medium backdrop-blur transition-colors hover:bg-white/25"
      >
        Compare plans
      </Link>
    </div>
  )
}
