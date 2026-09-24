import { createBrowserClient } from '@supabase/ssr'
import { sessionCookieDomain } from '@/lib/cookie-domain'
import type { SupabaseClient } from '@supabase/supabase-js'
import { appMode, isDemo, isLive, type AppMode } from '@/lib/app-mode'

/**
 * Supabase, browser side.
 *
 * This module is reachable from client components, so it holds the anon key and
 * nothing else. Every request it makes carries the signed-in user's JWT, which
 * means row level security applies to all of it — that is the point.
 *
 * The service-role client lives in supabase.server.ts, which a client component
 * cannot import without the build failing.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export { appMode, isDemo, isLive }
export type { AppMode }

/** Whether a real database is wired up. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

let browser: SupabaseClient | null = null

/**
 * The client a browser uses. Sessions live in cookies rather than localStorage
 * so the server can read them too — without that, middleware and server
 * components cannot tell who is signed in.
 */
export function browserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured — browserClient() is unavailable in this mode')
  }
  const domain =
    typeof window === 'undefined' ? undefined : sessionCookieDomain(window.location.hostname)
  browser ??= createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    domain ? { cookieOptions: { domain } } : undefined,
  )
  return browser
}
