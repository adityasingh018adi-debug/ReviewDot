/** Canonical customer-facing short link shown on printed material. */
export const PUBLIC_DOMAIN = 'reviewdot.in'

export function displayUrl(code: string): string {
  return `${PUBLIC_DOMAIN}/r/${code}`
}

/**
 * The URL actually encoded into a QR code. In production this is the short
 * domain; in this demo build it points back at the running app so the codes on
 * screen are genuinely scannable with a phone.
 */
export function scanUrl(code: string): string {
  if (typeof window === 'undefined') return `https://${displayUrl(code)}`
  const base = `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}`.replace(/\/+$/, '')
  return `${base}/#/r/${code}`
}
