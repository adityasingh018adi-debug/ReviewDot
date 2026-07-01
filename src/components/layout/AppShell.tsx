import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWorkspace } from '@/store/workspace'
import { useHotkey, useMediaQuery } from '@/lib/hooks'
import { AuroraBackground } from './AuroraBackground'
import { Sidebar, MobileNav } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { Toasts } from './Toasts'
import { Onboarding } from './Onboarding'
import { AssistantOrb, AssistantPanel } from '@/components/ai/Assistant'

/** Soft glow that trails the pointer. Compositor-only; disabled on touch. */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const fine = useMediaQuery('(pointer: fine)')

  useEffect(() => {
    if (!fine) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        ref.current?.style.setProperty('transform', `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [fine])

  if (!fine) return null
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-0 h-[400px] w-[400px] rounded-full opacity-70 will-change-transform"
      style={{ background: 'radial-gradient(circle, rgb(97 114 243 / 0.07), transparent 60%)' }}
    />
  )
}

export function AppShell() {
  const collapsed = useWorkspace((s) => s.sidebarCollapsed)
  const toggleSidebar = useWorkspace((s) => s.toggleSidebar)
  const setAssistantOpen = useWorkspace((s) => s.setAssistantOpen)
  const location = useLocation()
  const navigate = useNavigate()

  // workspace-level shortcuts (skip when typing in a field)
  const notTyping = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement
    return t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA' && !t.isContentEditable
  }
  useHotkey('[', (e) => notTyping(e) && toggleSidebar())
  useHotkey('a', (e) => notTyping(e) && setAssistantOpen(true))
  useHotkey('1', (e) => notTyping(e) && navigate('/'))
  useHotkey('2', (e) => notTyping(e) && navigate('/reviews'))
  useHotkey('3', (e) => notTyping(e) && navigate('/analytics'))

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <CursorGlow />
      <Sidebar />
      <MobileNav />

      <div className="px-4 pb-24 md:pb-8">
        <div
          className="mx-auto max-w-[1400px] transition-[margin-left] duration-300 ease-out md:ml-[calc(var(--sidebar-w)+1rem)]"
          style={{ ['--sidebar-w' as string]: collapsed ? '76px' : '248px' }}
        >
          <Topbar />
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 18, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>

      <AssistantOrb />
      <AssistantPanel />
      <CommandPalette />
      <Toasts />
      <Onboarding />
    </div>
  )
}
