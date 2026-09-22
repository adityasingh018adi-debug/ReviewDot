import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './supabase'

/**
 * Supabase, server side. Two clients, and the difference matters:
 *
 *   serverClient()   carries the signed-in user's JWT from the request cookies,
 *                    so every query is filtered by row level security. This is
 *                    what dashboard code uses. If it returns nothing, that is
 *                    the database refusing, not a bug to work around.
 *
 *   serviceClient()  holds the service role and bypasses row level security
 *                    entirely. It exists for exactly two things: the anonymous
 *                    scan path (where the customer has no account but the
 *                    server must still resolve a campaign) and background jobs.
 *                    Reaching for it anywhere else silently removes tenant
 *                    isolation from that code path.
 *
 * Both throw in a browser, so a stray import cannot leak either key into client
 * JavaScript.
 */

function assertServerOnly(name: string): void {
  if (typeof window !== 'undefined') {
    throw new Error(`${name} is server-only — it must never run in the browser`)
  }
}

/**
 * Request-scoped client bound to the caller's session. Row level security
 * applies. Use this for everything a signed-in user does.
 */
export async function serverClient(): Promise<SupabaseClient> {
  assertServerOnly('serverClient()')
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured — serverClient() is unavailable in this mode')
  }

  const store = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // Server Components may not write cookies. The middleware refreshes
          // the session on every request, so nothing is lost by ignoring this.
        }
      },
    },
  })
}

/**
 * Service-role client. Bypasses row level security — restricted by convention
 * to the anonymous scan path and background jobs. Anything a signed-in user
 * triggers should use serverClient() so the database enforces their tenancy.
 */
export function serviceClient(): SupabaseClient {
  assertServerOnly('serviceClient()')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !key) throw new Error('Supabase service credentials are not configured')
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
}
