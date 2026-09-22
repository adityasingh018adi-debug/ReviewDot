'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Calendar, ChevronDown, LogOut, Menu, Moon, Settings, Sun } from 'lucide-react'
import { business, outlets } from '@/lib/data'
import { RANGE_OPTIONS } from '@/lib/metrics'
import type { RangeKey } from '@/lib/metrics'
import { useApp } from '@/store/app'
import { useTheme } from '@/lib/theme'
import { useClickOutside } from '@/lib/hooks'
import { initialsOf, useSession } from './SessionProvider'
import { signOutAction } from '@/app-actions/auth'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

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

        <BusinessPicker />
        <OutletPicker />
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

function Popover({
  label,
  value,
  children,
  icon,
  className,
}: {
  label: string
  value: string
  children: (close: () => void) => React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))
  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:bg-raised"
      >
        {icon}
        <span className="max-w-[120px] truncate">{value}</span>
        <ChevronDown size={14} className="text-faint" />
      </button>
      {open ? (
        <div className="absolute left-0 top-12 z-50 min-w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-float">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

const itemClass = (active: boolean) =>
  cn(
    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition-colors',
    active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-raised',
  )

function BusinessPicker() {
  const { organization, mode } = useSession()

  // The organization comes from the session, so a real account never sees the
  // demo business in its own workspace.
  const name = organization?.name ?? business.name
  const mark = mode === 'demo' ? business.mark : initialsOf(name, 'RD')

  return (
    <Popover
      label="Select business"
      value={name}
      icon={
        <span className="grid size-6 place-items-center rounded-md bg-accent text-[10px] font-semibold text-on-accent">
          {mark}
        </span>
      }
    >
      {(close) => (
        <>
          <button className={itemClass(true)} onClick={close}>
            {name}
            {mode === 'demo' ? <span className="text-[11px] text-faint">{business.plan}</span> : null}
          </button>
          <p className="px-3 py-2 text-[12px] text-faint">
            Multi-brand workspaces are available on the Scale plan.
          </p>
        </>
      )}
    </Popover>
  )
}

function OutletPicker() {
  const outletId = useApp((s) => s.outletId)
  const setOutlet = useApp((s) => s.setOutlet)
  const current = outlets.find((outlet) => outlet.id === outletId)
  return (
    <Popover label="Select outlet" value={current ? current.name : 'All outlets'} className="hidden sm:block">
      {(close) => (
        <>
          <button
            className={itemClass(outletId === 'all')}
            onClick={() => {
              setOutlet('all')
              close()
            }}
          >
            All outlets
          </button>
          {outlets.map((outlet) => (
            <button
              key={outlet.id}
              className={itemClass(outletId === outlet.id)}
              onClick={() => {
                setOutlet(outlet.id)
                close()
              }}
            >
              {outlet.name}
              <span className="text-[11px] text-faint">{outlet.city}</span>
            </button>
          ))}
        </>
      )}
    </Popover>
  )
}

function RangePicker() {
  const rangeKey = useApp((s) => s.rangeKey)
  const customRange = useApp((s) => s.customRange)
  const setRange = useApp((s) => s.setRange)
  const [draft, setDraft] = useState(customRange)
  const label =
    rangeKey === 'custom' && customRange.from && customRange.to
      ? `${customRange.from} → ${customRange.to}`
      : (RANGE_OPTIONS.find((option) => option.key === rangeKey)?.label ?? '30 days')

  return (
    <Popover label="Select date range" value={label} icon={<Calendar size={15} className="text-faint" />}>
      {(close) => (
        <>
          {RANGE_OPTIONS.filter((option) => option.key !== 'custom').map((option) => (
            <button
              key={option.key}
              className={itemClass(rangeKey === option.key)}
              onClick={() => {
                setRange(option.key as RangeKey)
                close()
              }}
            >
              {option.label}
            </button>
          ))}
          <div className="mt-1 border-t border-line p-2.5">
            <p className="mb-2 text-[12px] font-medium text-ink">Custom range</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="From date"
                className="h-9 px-2 text-[12px]"
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
              <Input
                type="date"
                aria-label="To date"
                className="h-9 px-2 text-[12px]"
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </div>
            <Button
              size="sm"
              className="mt-2 w-full"
              disabled={!draft.from || !draft.to}
              onClick={() => {
                setRange('custom', draft)
                close()
              }}
            >
              Apply
            </Button>
          </div>
        </>
      )}
    </Popover>
  )
}
