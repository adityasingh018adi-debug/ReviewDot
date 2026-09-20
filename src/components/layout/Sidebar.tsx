import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  MessageSquareWarning,
  Megaphone,
  Package,
  QrCode,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { business, outlets } from '@/lib/data'
import { useQRCodes } from '@/store/app'
import { cn } from '@/lib/utils'

export const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/app/feedback', label: 'Feedback', icon: MessageSquareWarning },
  { to: '/app/products', label: 'Products', icon: Package },
  { to: '/app/outlets', label: 'Outlets', icon: Building2 },
  { to: '/app/qr', label: 'QR Codes', icon: QrCode },
  { to: '/app/customers', label: 'Customers', icon: Users },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/app/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const codes = useQRCodes()
  return (
    <div className="flex h-full flex-col gap-6 border-r border-line bg-surface px-4 py-5">
      <div className="px-2">
        <Logo to="/app" />
      </div>

      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors duration-150',
                isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-raised hover:text-ink',
              )
            }
          >
            <item.icon size={17} strokeWidth={1.9} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl border border-line bg-raised p-4">
        <p className="text-[13px] font-semibold text-ink">{business.plan} plan</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {outlets.length} outlets · {codes.length} QR codes · unlimited reviews
        </p>
        <NavLink
          to="/pricing"
          className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline"
        >
          Compare plans →
        </NavLink>
      </div>
    </div>
  )
}
