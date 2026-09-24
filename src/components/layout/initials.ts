/**
 * Not in SessionProvider, and that is the whole point.
 *
 * `app/app/layout.tsx` is a Server Component and computes the avatar initials
 * before handing the session down. SessionProvider is `'use client'`, and a
 * function imported from a client module cannot be *called* on the server —
 * React replaces it with a reference stub and throws "Attempted to call
 * initialsOf() from the server". That throw only happens in live mode, because
 * demo mode hardcodes its initials, so nothing in demo mode, the unit tests or
 * the Playwright run ever reached it. It broke the dashboard for real accounts
 * the moment they signed in.
 *
 * Plain modules like this one are importable from both sides, which is what a
 * shared pure function should be.
 */

/** First letters of the first two words, e.g. "Ritika Shah" → "RS". */
export function initialsOf(name: string, fallback = '?'): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return fallback
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}
