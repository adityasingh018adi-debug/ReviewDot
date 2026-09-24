'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useClickOutside } from '@/lib/hooks'
import { useSession } from './SessionProvider'
import { RangePicker } from './ScopePickers'
import { signOutAction } from '@/app-actions/auth'

/**
 * The dashboard chrome: what is true across every page.
 *
 * The outlet filter is not here — it belongs beside the page title, where the
 * figures it changes are. See ScopePickers.
 */
export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="rounded-xl p-2.5 text-ink transition-colors hover:bg-raised lg:hidden"
        >
          <Menu size={18} />
        </button>

        <SearchField />

        <div className="ml-auto flex items-center gap-2">
          <RangePicker />
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="rounded-xl p-2.5 text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * Search.
 *
 * Rendered as a link rather than an input: there is no search index behind it
 * yet, and a box that swallows what you type without answering is worse than
 * one that takes you somewhere that can. It goes to the review inbox, which is
 * the only thing currently searchable.
 */
function SearchField() {
  return (
    <Link
      href="/app/inbox"
      className="hidden h-10 min-w-[220px] flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-[13px] text-faint transition-colors hover:bg-raised sm:flex sm:max-w-md"
    >
      <Search size={15} />
      <span className="flex-1 truncate">Search reviews and feedback…</span>
    </Link>
  )
}

/**
 * The signed-in account. Shows whoever the server resolved — never a name baked
 * into the component — and is the only place a session can be ended.
 */
function AccountMenu() {
  const { user, organization, mode } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:bg-raised"
      >
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-[11px] font-semibold text-on-accent">
          {user.initials}
        </span>
        <span className="hidden max-w-32 truncate text-[13px] font-medium text-ink sm:block">
          {user.fullName}
        </span>
        <ChevronDown size={14} className="hidden text-faint sm:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13px] font-medium text-ink">{user.fullName}</p>
            <p className="truncate text-[12px] text-muted">{user.email}</p>
            {organization ? (
              <p className="mt-1 truncate text-[12px] text-faint">{organization.name}</p>
            ) : null}
          </div>

          <Link
            href="/app/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          >
            <Settings size={15} /> Settings
          </Link>

          {mode === 'demo' ? (
            <p className="border-t border-line px-4 py-2.5 text-[12px] leading-relaxed text-faint">
              Demo workspace — no account is signed in.
            </p>
          ) : (
            <form action={signOutAction} className="border-t border-line">
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-ink-soft transition-colors hover:bg-raised hover:text-ink"
              >
                <LogOut size={15} /> Log out
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  )
}
