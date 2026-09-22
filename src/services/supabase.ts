import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase clients.
 *
 * Two, deliberately:
 *   browserClient  anon key, subject to row level security
 *   serviceClient  service role, bypasses RLS — server code only
 *
 * `serviceClient()` throws if called where a browser bundle could reach it, so
 * a stray import cannot leak the key into client JavaScript.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Whether a real database is wired up; false runs the app on demo data. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

let browser: SupabaseClient | null = null

export function browserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured')
  browser ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return browser
}

export function serviceClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('serviceClient() is server-only — it must never run in the browser')
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !key) throw new Error('Supabase service credentials are not configured')
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
}
