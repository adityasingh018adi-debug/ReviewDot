/**
 * QR identity.
 *
 * Every campaign carries two identifiers:
 *
 *   reference_code  RD-LL-TH-T04 — printed on collateral and read by humans.
 *                   Derived from the organization, outlet and placement, so
 *                   staff can match a code to a table without a lookup.
 *   public_id       the /r/{public_id} segment — unguessable, so a code cannot
 *                   be enumerated to reach another tenant's scan page.
 *
 * Only public_id is ever used for lookups. reference_code is a label.
 */

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no look-alike characters
const PUBLIC_ID_LENGTH = 10

/** Cryptographically random id for the scan URL. */
export function generatePublicId(length = PUBLIC_ID_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  // rejection-free mapping: the alphabet length is small enough that modulo
  // bias is negligible for non-secret-bearing identifiers of this length
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length]
  return out
}

/** Normalise a name into a short uppercase code, e.g. "Love & Latte" → "LL". */
export function shortCodeFor(name: string, maxLength = 4): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return 'XX'

  const initials = words.map((word) => word[0]).join('')
  const candidate = initials.length >= 2 ? initials : words[0].slice(0, maxLength)
  return candidate.slice(0, maxLength).padEnd(2, 'X')
}

/** Placement suffix: "Table 04" → "T04", "Counter" → "CNT". */
export function placementCode(placement: string | undefined, fallback = 'GEN'): string {
  if (!placement?.trim()) return fallback
  const text = placement.trim().toUpperCase()
  const numbered = text.match(/^([A-Z])[A-Z]*\s*0*(\d{1,3})$/)
  if (numbered) return `${numbered[1]}${numbered[2].padStart(2, '0')}`
  return text.replace(/[^A-Z0-9]/g, '').slice(0, 3).padEnd(2, 'X')
}

/**
 * Human-readable campaign label: RD-{org}-{outlet}-{placement}.
 * Uniqueness is enforced per organization by the database, not here.
 */
export function referenceCode(input: {
  orgShortCode: string
  outletShortCode: string
  placement?: string
  fallback?: string
}): string {
  return ['RD', input.orgShortCode, input.outletShortCode, placementCode(input.placement, input.fallback)]
    .map((part) => part.toUpperCase())
    .join('-')
}

/** Parses a reference code back into its parts; returns null when malformed. */
export function parseReferenceCode(code: string): {
  orgShortCode: string
  outletShortCode: string
  placement: string
} | null {
  const match = /^RD-([A-Z0-9]{2,6})-([A-Z0-9]{2,6})-([A-Z0-9]{2,6})$/.exec(code.trim().toUpperCase())
  if (!match) return null
  return { orgShortCode: match[1], outletShortCode: match[2], placement: match[3] }
}
