import { serviceClient } from './supabase.server'
import { isSupabaseConfigured } from './supabase'
import { limiter as memory, type RateLimitResult } from '@/lib/rate-limit'
import { reportError } from '@/lib/observability'

/**
 * Rate limiting that survives a restart and covers every instance.
 *
 * The in-memory limiter it replaces held counters in one Node process, so the
 * real ceiling was (instances × limit) and a cold start wiped it. That is a
 * brake on a script, not a limit.
 *
 * Counting happens in Postgres via app_rate_limit(), which is SECURITY DEFINER
 * with the table revoked from every client role — a caller cannot rewrite their
 * own counter. The function is reached with the service role because it is
 * revoked from `authenticated` too: being signed in is not permission to
 * arbitrate your own limit.
 *
 * On a database error this falls back to the in-memory limiter rather than
 * failing either way outright. Failing closed would break the customer flow
 * over a transient blip; failing fully open would remove the brake entirely at
 * exactly the moment something is going wrong. The fallback keeps a brake, and
 * the error is recorded.
 */

export type LimitVerdict = RateLimitResult & { durable: boolean }

export async function checkLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<LimitVerdict> {
  if (!isSupabaseConfigured()) {
    return { ...memory.check(key, max, windowSeconds * 1000), durable: false }
  }

  try {
    const { data, error } = await serviceClient().rpc('app_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) throw error

    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed: boolean; remaining: number; retry_after_seconds: number }
      | undefined

    if (!row) throw new Error('rate limiter returned no row')

    return {
      ok: row.allowed,
      remaining: Number(row.remaining) || 0,
      retryAfterMs: (Number(row.retry_after_seconds) || 0) * 1000,
      durable: true,
    }
  } catch (error) {
    reportError('rate.limit', error, { key: key.split(':')[0] })
    return { ...memory.check(key, max, windowSeconds * 1000), durable: false }
  }
}

/** Seconds a caller should wait, for a Retry-After header. */
export function retryAfterSeconds(verdict: LimitVerdict): number {
  return Math.max(1, Math.ceil(verdict.retryAfterMs / 1000))
}
