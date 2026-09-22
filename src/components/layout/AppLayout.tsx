'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SessionProvider, type UiSession } from './SessionProvider'
import { SampleDataBanner } from './SampleDataBanner'

export function AppLayout({
  session,
  children,
}: {
  session: UiSession
  children: React.ReactNode
}) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <SessionProvider value={session}>
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      <AnimatePresence>
        {navOpen ? (
          <div className="fixed inset-0 z-100 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-coal-950/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNavOpen(false)}
            />
            <motion.div
              className="relative h-full w-72"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <Sidebar onNavigate={() => setNavOpen(false)} />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        {session.mode === 'live' ? <SampleDataBanner /> : null}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
    </SessionProvider>
  )
}
