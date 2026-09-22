'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AppMode } from '@/lib/app-mode'
import type { Role } from '@/lib/permissions'

/**
 * Who the dashboard is rendering for.
 *
 * Resolved once on the server in app/app/layout.tsx and passed down, so no
 * client component ever has to ask — and so there is one place where identity
 * comes from. This mirrors what the database already knows; it decides what the
 * UI offers, never what the server allows.
 */

export type UiSession = {
  mode: AppMode
  user: { id: string; email: string; fullName: string; initials: string }
  organization: { id: string; name: string } | null
  role: Role
  assignedOutletIds: string[]
}

const SessionContext = createContext<UiSession | null>(null)

export function SessionProvider({ value, children }: { value: UiSession; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): UiSession {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession() must be used inside the dashboard layout')
  return session
}

/** First letters of the first two words, e.g. "Ritika Shah" → "RS". */
export function initialsOf(name: string, fallback = '?'): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return fallback
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}
