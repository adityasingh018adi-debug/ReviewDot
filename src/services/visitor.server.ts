import { createHmac } from 'node:crypto'

/**
 * The anonymous per-device identifier stored on a scan.
 *
 * `qr_scans.visitor_hash` exists so a business can count unique visitors rather
 * than raw scans. It has been null on every row ever written, which makes that
 * count impossible — but filling it with anything identifying would be worse, so
 * the shape matters:
 *
 *   hash = HMAC(secret + UTC date, ip + user agent), truncated
 *
 * The address and user agent are inputs, never stored. The date is in the key,
 * so the same phone produces a different hash tomorrow: the value distinguishes
 * devices within a day and cannot be used to follow one across days, or joined
 * against anything outside this table. It is not reversible without the secret,
 * and a rainbow table over the IPv4 space buys an attacker one day of a
 * business's own scan counts.
 *
 * Without VISITOR_SALT configured there is no secret to key on, so this returns
 * null and says so once. A weak fabricated hash would be worse than an honest
 * absence — unique counts would look plausible and be wrong.
 */

const HASH_LENGTH = 24

let warned = false

/** Pure core, so the shape and the rotation can be tested without env or clocks. */
export function computeVisitorHash(input: {
  secret: string
  ip: string
  userAgent: string
  /** UTC day, as YYYY-MM-DD. */
  day: string
}): string {
  return createHmac('sha256', `${input.secret}:${input.day}`)
    .update(`${input.ip}\n${input.userAgent}`)
    .digest('hex')
    .slice(0, HASH_LENGTH)
}

export function utcDay(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10)
}

export function visitorHash(ip: string, userAgent: string, at: Date = new Date()): string | null {
  const secret = process.env.VISITOR_SALT?.trim()
  if (!secret) {
    if (!warned) {
      warned = true
      console.warn(
        JSON.stringify({
          level: 'warn',
          scope: 'scan.record',
          message:
            'VISITOR_SALT is not set, so scans are recorded without a visitor hash and unique-visitor counts are unavailable.',
        }),
      )
    }
    return null
  }
  return computeVisitorHash({ secret, ip, userAgent, day: utcDay(at) })
}

/** Truncated so a stray header cannot write a megabyte into every scan row. */
export function trimHeader(value: string | null, max = 400): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, max) : null
}
