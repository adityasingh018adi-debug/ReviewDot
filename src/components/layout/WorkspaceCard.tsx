'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown } from 'lucide-react'
import { initialsOf, useSession } from './SessionProvider'
import { switchOrganizationAction } from '@/app-actions/workspace'
import { useClickOutside } from '@/lib/hooks'
import { business } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * Which workspace the dashboard is showing, at the top of the sidebar.
 *
 * Switching writes a cookie through switchOrganizationAction, which re-checks
 * membership on the server before accepting it — the list here is what the UI
 * offers, never what the server allows.
 */
export function WorkspaceCard() {
  const { organization, organizations, mode } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))

  const name = organization?.name ?? business.name
  const mark = mode === 'demo' ? business.mark : initialsOf(name, 'RD')
  const canSwitch = mode !== 'demo' && organizations.length > 1

  const switchTo = async (id: string) => {
    setPending(true)
    try {
      const form = new FormData()
      form.set('organizationId', id)
      const result = await switchOrganizationAction(form)
      if (!result.error) {
        setOpen(false)
        // the scope in the query string belongs to the workspace being left
        router.push('/app')
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-haspopup={canSwitch ? 'menu' : undefined}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-raised p-2.5 text-left transition-colors hover:bg-line/50"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-[12px] font-bold text-on-accent">
          {mark}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            Workspace
          </span>
          <span className="block truncate text-[13.5px] font-semibold text-ink">{name}</span>
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-faint" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-float"
        >
          {mode === 'demo' ? (
            <p className="px-3 py-2 text-[12px] leading-relaxed text-faint">
              Demo workspace — no account is signed in.
            </p>
          ) : (
            <>
              {organizations.map((workspace) => {
                const active = workspace.id === organization?.id
                return (
                  <button
                    key={workspace.id}
                    disabled={pending}
                    onClick={() => (active ? setOpen(false) : void switchTo(workspace.id))}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-colors',
                      active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-raised',
                    )}
                  >
                    <span className="flex-1 truncate">{workspace.name}</span>
                    {active ? <Check size={14} className="shrink-0" /> : null}
                  </button>
                )
              })}
              {organizations.length < 2 ? (
                <p className="px-3 py-2 text-[12px] leading-relaxed text-faint">
                  You belong to one workspace. Others appear here once you are invited to them.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
