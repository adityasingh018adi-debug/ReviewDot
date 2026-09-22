/**
 * A fixed-window rate limiter, per process.
 *
 * Honest about what it is: the counters live in this Node process, so on a
 * multi-instance host the real ceiling is (instances × limit) and everything
 * resets on a cold start. That makes it useless as a quota and useful as what it
 * is here — a brake on scripted abuse of endpoints that write to the database
 * without an account behind them. A durable limiter is a later phase.
 *
 * The version this replaces kept one array per key and never removed any of
 * them, so a scanning attack grew the map until the process died. This one
 * prunes.
 */

export type RateLimitResult = {
  ok: boolean
  /** Requests left in the current window. */
  remaining: number
  /** Milliseconds until the window frees up. Zero when `ok`. */
  retryAfterMs: number
}

export type RateLimiter = {
  check(key: string, max: number, windowMs: number): RateLimitResult
  /** Test seam: how many keys are being tracked. */
  size(): number
  reset(): void
}

/** Stop the map growing without bound when keys are never seen again. */
const PRUNE_EVERY = 500

export function createRateLimiter(now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>()
  let sincePrune = 0

  function prune(cutoffFor: (key: string) => number): void {
    for (const [key, times] of hits) {
      const kept = times.filter((time) => time > cutoffFor(key))
      if (kept.length === 0) hits.delete(key)
      else hits.set(key, kept)
    }
  }

  return {
    check(key, max, windowMs) {
      const current = now()
      const cutoff = current - windowMs

      if (++sincePrune >= PRUNE_EVERY) {
        sincePrune = 0
        prune(() => current - windowMs)
      }

      const recent = (hits.get(key) ?? []).filter((time) => time > cutoff)

      if (recent.length >= max) {
        const oldest = recent[0]!
        hits.set(key, recent)
        return { ok: false, remaining: 0, retryAfterMs: Math.max(0, oldest + windowMs - current) }
      }

      recent.push(current)
      hits.set(key, recent)
      return { ok: true, remaining: max - recent.length, retryAfterMs: 0 }
    },
    size: () => hits.size,
    reset: () => {
      hits.clear()
      sincePrune = 0
    },
  }
}

/** The limiter the app shares. */
export const limiter = createRateLimiter()

/**
 * The caller's address, as far as we can tell behind a proxy.
 *
 * Used only as a rate-limit key and as an input to the visitor hash — never
 * stored. `x-forwarded-for` is client-settable when no proxy overwrites it, so
 * this is a best-effort bucket, not an identity.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}
