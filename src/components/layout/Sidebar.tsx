import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquareText,
  BarChart3,
  Settings,
  ChevronsLeft,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useWorkspace } from '@/store/workspace'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/reviews', label: 'Reviews', icon: MessageSquareText, badge: 12 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Floating, collapsible primary navigation. State persists across sessions. */
export function Sidebar() {
  const collapsed = useWorkspace((s) => s.sidebarCollapsed)
  const toggle = useWorkspace((s) => s.toggleSidebar)
  const location = useLocation()

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: collapsed ? 76 : 248 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-strong fixed top-4 bottom-4 left-4 z-40 hidden flex-col rounded-3xl shadow-float md:flex"
    >
      <div className={cn('flex items-center gap-3 px-5 pt-6 pb-2', collapsed && 'justify-center px-0')}>
        <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pulse-500 to-aura-500 shadow-glow-sm">
          <Sparkles size={18} className="text-pure" />
          <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="font-display text-lg font-bold tracking-tight text-mist-50"
            >
              Review<span className="text-gradient">Dot</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="mt-6 flex-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                collapsed && 'justify-center px-0',
                active ? 'text-mist-50' : 'text-mist-400 hover:bg-white/5 hover:text-mist-100',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl border border-pulse-400/30 bg-pulse-500/15 shadow-glow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                size={19}
                className="relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10 flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.badge && (
                <span className="relative z-10 rounded-full bg-pulse-500/25 px-2 py-0.5 text-[10px] font-semibold text-pulse-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-3 p-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="glass relative overflow-hidden rounded-2xl p-4"
            >
              <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-aura-500/25 blur-2xl" />
              <div className="flex items-center gap-2 text-xs font-semibold text-mist-100">
                <Zap size={14} className="text-amber-glow" /> AI Credits
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '72%' }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-pulse-400 to-aura-400"
                />
              </div>
              <div className="mt-1.5 text-[11px] text-mist-400">7,200 / 10,000 this month</div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronsLeft size={16} />
          </motion.span>
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </motion.aside>
  )
}

/** Bottom tab bar for mobile. */
export function MobileNav() {
  const location = useLocation()
  return (
    <nav className="glass-strong fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-2xl px-2 py-2 shadow-float md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-medium transition-colors',
              active ? 'text-pulse-300' : 'text-mist-400',
            )}
          >
            {active && (
              <motion.span layoutId="mobile-pill" className="absolute inset-0 rounded-xl bg-pulse-500/15" />
            )}
            <Icon size={20} className="relative z-10" />
            <span className="relative z-10">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
