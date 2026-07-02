import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Plus,
  Command,
  Star,
  MessageSquareText,
  TrendingUp,
  Sun,
  Moon,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useWorkspace, useToasts } from '@/store/workspace'
import { useDataset } from '@/lib/data'
import { useBusiness } from '@/lib/business'
import { Button } from '@/components/ui/Button'
import { cn, timeAgo } from '@/lib/utils'

/** Multi-location switcher — filters reviews across the workspace. */
function LocationSwitcher() {
  const dataset = useDataset()
  const activeLocation = useBusiness((s) => s.activeLocation)
  const setActiveLocation = useBusiness((s) => s.setActiveLocation)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])

  const options = ['all', ...dataset.locations]

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-edge bg-white/4 px-3 text-xs font-medium text-mist-200 transition-colors hover:border-white/20"
        aria-label="Switch location"
      >
        <MapPin size={13} className="text-pulse-300" />
        {activeLocation === 'all' ? 'All locations' : activeLocation}
        <ChevronDown size={13} className={cn('text-mist-500 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute top-12 left-0 z-50 w-48 overflow-hidden rounded-xl p-1 shadow-float"
          >
            {options.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setActiveLocation(loc)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors',
                  activeLocation === loc ? 'bg-pulse-500/15 text-mist-50' : 'text-mist-300 hover:bg-white/5',
                )}
              >
                {loc === 'all' ? 'All locations' : loc}
                {activeLocation === loc && <Check size={12} className="text-pulse-300" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const notifications = [
  { id: 1, icon: Star, text: 'New 5★ review from Ava Chen', time: '2m ago', unread: true },
  { id: 2, icon: TrendingUp, text: 'Weekly sentiment report is ready', time: '1h ago', unread: true },
  {
    id: 3,
    icon: MessageSquareText,
    text: '4 AI reply drafts awaiting approval',
    time: '3h ago',
    unread: false,
  },
]

/** Sticky top navigation: global search, quick actions, notifications. */
export function Topbar() {
  const setPaletteOpen = useWorkspace((s) => s.setPaletteOpen)
  const theme = useWorkspace((s) => s.theme)
  const toggleTheme = useWorkspace((s) => s.toggleTheme)
  const pushToast = useToasts((s) => s.push)
  const navigate = useNavigate()
  const dataset = useDataset()
  const [query, setQuery] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])

  const results = query.trim()
    ? dataset.reviews
        .filter(
          (r) =>
            r.author.toLowerCase().includes(query.toLowerCase()) ||
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.body.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
    : []

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.08 }}
      className="glass-strong sticky top-4 z-30 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-panel"
    >
      {/* workspace-wide search */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mist-500"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
          placeholder="Search reviews, customers, insights…"
          className={cn(
            'h-10 w-full rounded-xl border border-white/8 bg-white/4 pr-16 pl-9 text-sm text-mist-100',
            'placeholder:text-mist-500 transition-all duration-300 outline-none',
            'focus:border-pulse-400/50 focus:bg-white/6 focus:shadow-glow-sm',
          )}
        />
        <button
          onClick={() => setPaletteOpen(true)}
          className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-mist-400 transition-colors hover:text-mist-100"
        >
          <Command size={10} /> K
        </button>

        <AnimatePresence>
          {searchFocus && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="glass-strong absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-xl shadow-float"
            >
              {results.map((r) => (
                <button
                  key={r.id}
                  onMouseDown={() => {
                    navigate('/reviews')
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/6"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pulse-500/20 text-[10px] font-bold text-pulse-300">
                    {r.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-mist-100">{r.title}</span>
                    <span className="block truncate text-xs text-mist-400">
                      {r.author} · {r.platform} · {timeAgo(r.date)}
                    </span>
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-glow">
                    {r.rating} <Star size={11} fill="currentColor" />
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LocationSwitcher />

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() =>
            pushToast({
              tone: 'success',
              title: 'Source connected',
              body: 'New review source is now syncing.',
            })
          }
        >
          <Plus size={14} /> Connect source
        </Button>

        {/* theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </motion.span>
        </Button>

        {/* notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-pulse-400 opacity-70" />
              <span className="h-2 w-2 rounded-full bg-pulse-400" />
            </span>
          </Button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="glass-strong absolute top-12 right-0 z-50 w-80 origin-top-right overflow-hidden rounded-2xl shadow-float"
              >
                <div className="border-b border-white/8 px-4 py-3 text-sm font-semibold text-mist-100">
                  Notifications
                </div>
                {notifications.map((n, i) => {
                  const Icon = n.icon
                  return (
                    <motion.button
                      key={n.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      onClick={() => setNotifOpen(false)}
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pulse-500/15 text-pulse-300">
                        <Icon size={15} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm text-mist-100">{n.text}</span>
                        <span className="text-xs text-mist-400">{n.time}</span>
                      </span>
                      {n.unread && <span className="mt-1.5 h-2 w-2 rounded-full bg-pulse-400" />}
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* profile */}
        <button className="group flex items-center gap-2.5 rounded-xl py-1 pr-1 pl-1 transition-colors hover:bg-white/5 sm:pr-3">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-glow/70 to-pulse-500 text-xs font-bold text-pure ring-2 ring-white/10 transition-transform group-hover:scale-105">
            MS
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-mint-400" />
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-xs font-semibold text-mist-100">Mantoo Singh</span>
            <span className="block text-[10px] text-mist-400">Enterprise</span>
          </span>
        </button>
      </div>
    </motion.header>
  )
}
