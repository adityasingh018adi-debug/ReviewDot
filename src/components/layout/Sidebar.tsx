'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  MessageSquareWarning,
  Package,
  QrCode,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useSession } from './SessionProvider'
import { business, outlets } from '@/lib/data'
import { useQRCodes } from '@/store/app'
import { cn } from '@/lib/utils'

export const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/app/inbox', label: 'Review inbox', icon: MessageSquare },
  { href: '/app/feedback', label: 'Feedback', icon: MessageSquareWarning },
  { href: '/app/outlets', label: 'Outlets', icon: Building2 },
  { href: '/app/campaigns', label: 'QR campaigns', icon: QrCode },
  { href: '/app/products', label: 'Products', icon: Package },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/app/insights', label: 'AI insights', icon: Sparkles },
  { href: '/app/customers', label: 'Customers', icon: Users },
  { href: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const codes = useQRCodes()
  const pathname = usePathname()
  const { organization, mode } = useSession()
  return (
    <div className="flex h-full flex-col gap-6 border-r border-line bg-surface px-4 py-5">
      <div className="px-2">
        <Logo href="/app" />
      </div>

      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.end ? pathname === item.href : Boolean(pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors duration-150',
                active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-raised hover:text-ink',
              )}
            >
              <item.icon size={17} strokeWidth={1.9} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="rounded-2xl border border-line bg-raised p-4">
        {mode === 'demo' ? (
          <>
            <p className="text-[13px] font-semibold text-ink">{business.plan} plan</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {outlets.length} outlets · {codes.length} QR codes · unlimited reviews
            </p>
          </>
        ) : (
          <>
            <p className="truncate text-[13px] font-semibold text-ink">
              {organization?.name ?? 'Your workspace'}
            </p>
            {/* Usage counts come from the database in a later phase. Showing the
                demo figures to a real account would be inventing their numbers. */}
            <p className="mt-1 text-[12px] leading-relaxed text-muted">Free plan</p>
          </>
        )}
        <Link
          href="/pricing"
          className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline"
        >
          Compare plans →
        </Link>
      </div>
    </div>
  )
}
