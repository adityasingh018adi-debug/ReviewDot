import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWorkspace } from '@/store/workspace'
import { useHotkey } from '@/lib/hooks'
import { AuroraBackground } from './AuroraBackground'
import { Sidebar, MobileNav } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { Toasts } from './Toasts'
import { Onboarding } from './Onboarding'
import { AssistantOrb, AssistantPanel } from '@/components/ai/Assistant'

export function AppShell() {
  const collapsed = useWorkspace((s) => s.sidebarCollapsed)
  const toggleSidebar = useWorkspace((s) => s.toggleSidebar)
  const setAssistantOpen = useWorkspace((s) => s.setAssistantOpen)
  const theme = useWorkspace((s) => s.theme)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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
  useHotkey('4', (e) => notTyping(e) && navigate('/team'))

  return (
    <div className="min-h-screen">
      <AuroraBackground />
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
