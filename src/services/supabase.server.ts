import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './supabase'
import { reportError } from '@/lib/observability'

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

/**
 * Next refuses cookie writes from a Server Component by design, with a specific
 * message. Matching on it keeps the expected refusal quiet without hiding a
 * real failure behind the same catch.
 */
function isReadOnlyCookieStore(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /can only be modified in a Server Action or Route Handler/i.test(message)
}

/** Request-scoped client cache, keyed on the request's own cookie store. */
const perRequest = new WeakMap<object, SupabaseClient>()

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

  // One client per request, and this is the load-bearing part.
  //
  // A single dashboard render calls this many times over — middleware, the
  // layout's session read, its membership read, the page's own context, the
  // outlet picker. Each call used to build its own Supabase client, each with
  // its own auth state, each seeing the same access token in the same cookie
  // jar. When that token is at its expiry they all try to renew it at once, and
  // Supabase retires a refresh token the instant it issues a replacement: one
  // wins, and the rest are told theirs was already used. A losing client treats
  // that as the end of the session and writes deleted cookies, which is how a
  // valid session was destroyed by its own page load and the person landed back
  // on the login form. Seventeen redemptions of one token, on one reload, is
  // what the reproduction measured.
  //
  // Sharing the client means one refresh, one rotation, one set of cookies.
  // Keyed on the cookie store because Next hands out exactly one per request,
  // and weakly so nothing is retained after it.
  const cached = perRequest.get(store)
  if (cached) return cached

  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch (error) {
          // A Server Component may not write cookies, and Next refuses the
          // write. That refusal is expected — but "expected" is not the same as
          // "harmless", which is what this comment used to claim.
          //
          // If the client renewed the token on its way here, the old refresh
          // token is already spent and this is the replacement being thrown
          // away. The browser then replays a token the auth server has retired,
          // and the next request is signed out. The defence is that the renewal
          // happens in middleware, which can write: every path whose server
          // components read a session goes through it (see SESSION_READING in
          // routes.ts), so by the time one runs the token is fresh and there is
          // nothing here to lose.
          //
          // Anything else is not expected, and swallowing it is how a sign-in
          // silently fails to persist — the action redirects to a dashboard the
          // browser has no session for, which bounces straight back to the
          // login form and looks exactly like a wrong password. Record it.
          if (!isReadOnlyCookieStore(error)) {
            reportError('auth.cookie', error, { names: list.map((c) => c.name).join(' ') })
          }
        }
      },
    },
  })

  perRequest.set(store, client)
  return client
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
