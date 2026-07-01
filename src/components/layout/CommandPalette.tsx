import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquareText,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  Download,
  Moon,
  PanelLeft,
  Search,
  CornerDownLeft,
} from 'lucide-react'
import { useWorkspace, useToasts } from '@/store/workspace'
import { useHotkey } from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  hint?: string
  section: string
  icon: typeof Search
  run: () => void
}

/** ⌘K command palette: fuzzy filtering, full keyboard navigation. */
export function CommandPalette() {
  const open = useWorkspace((s) => s.paletteOpen)
  const setOpen = useWorkspace((s) => s.setPaletteOpen)
  const toggleSidebar = useWorkspace((s) => s.toggleSidebar)
  const setAssistantOpen = useWorkspace((s) => s.setAssistantOpen)
  const pushToast = useToasts((s) => s.push)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useHotkey('mod+k', (e) => {
    e.preventDefault()
    setOpen(!open)
  })
  useHotkey('escape', () => setOpen(false), open)

  const commands: CommandItem[] = useMemo(
    () => [
      { id: 'nav-dash', label: 'Go to Dashboard', hint: 'G D', section: 'Navigate', icon: LayoutDashboard, run: () => navigate('/') },
      { id: 'nav-reviews', label: 'Go to Reviews', hint: 'G R', section: 'Navigate', icon: MessageSquareText, run: () => navigate('/reviews') },
      { id: 'nav-analytics', label: 'Go to Analytics', hint: 'G A', section: 'Navigate', icon: BarChart3, run: () => navigate('/analytics') },
      { id: 'nav-settings', label: 'Go to Settings', section: 'Navigate', icon: Settings, run: () => navigate('/settings') },
      {
        id: 'ai-open',
        label: 'Ask the AI assistant',
        hint: 'A',
        section: 'Actions',
        icon: Sparkles,
        run: () => setAssistantOpen(true),
      },
      {
        id: 'act-connect',
        label: 'Connect a review source',
        section: 'Actions',
        icon: Plus,
        run: () => pushToast({ tone: 'success', title: 'Source connected', body: 'New review source is now syncing.' }),
      },
      {
        id: 'act-export',
        label: 'Export analytics report',
        section: 'Actions',
        icon: Download,
        run: () => pushToast({ tone: 'info', title: 'Export started', body: 'Your report will be emailed shortly.' }),
      },
      {
        id: 'ws-sidebar',
        label: 'Toggle sidebar',
        hint: '[',
        section: 'Workspace',
        icon: PanelLeft,
        run: toggleSidebar,
      },
      {
        id: 'ws-theme',
        label: 'Switch appearance',
        section: 'Workspace',
        icon: Moon,
        run: () => pushToast({ tone: 'info', title: 'Midnight is the only mode', body: 'ReviewDot is designed for the dark.' }),
      },
    ],
    [navigate, pushToast, setAssistantOpen, toggleSidebar],
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.section.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => setIndex(0), [query])

  const execute = (cmd: CommandItem) => {
    setOpen(false)
    cmd.run()
  }

  const sections = [...new Set(filtered.map((c) => c.section))]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-ink-950/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -14 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong mx-auto mt-[12vh] w-[min(92vw,560px)] overflow-hidden rounded-2xl shadow-float"
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-4">
              <Search size={17} className="text-mist-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setIndex((i) => Math.min(filtered.length - 1, i + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setIndex((i) => Math.max(0, i - 1))
                  } else if (e.key === 'Enter' && filtered[index]) {
                    execute(filtered[index])
                  }
                }}
                placeholder="Type a command or search…"
                className="h-14 flex-1 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-500 outline-none"
              />
              <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-mist-400">
                ESC
              </kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-mist-400">
                  No commands match “{query}”
                </div>
              )}
              {sections.map((section) => (
                <div key={section}>
                  <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-mist-500 uppercase">
                    {section}
                  </div>
                  {filtered
                    .filter((c) => c.section === section)
                    .map((cmd) => {
                      const i = filtered.indexOf(cmd)
                      const Icon = cmd.icon
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => execute(cmd)}
                          onPointerEnter={() => setIndex(i)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                            i === index ? 'bg-pulse-500/15 text-mist-50' : 'text-mist-300',
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                              i === index
                                ? 'border-pulse-400/40 bg-pulse-500/20 text-pulse-300'
                                : 'border-white/8 bg-white/4 text-mist-400',
                            )}
                          >
                            <Icon size={15} />
                          </span>
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.hint && (
                            <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-mist-400">
                              {cmd.hint}
                            </kbd>
                          )}
                          {i === index && <CornerDownLeft size={13} className="text-mist-500" />}
                        </button>
                      )
                    })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
