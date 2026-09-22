/** Canonical customer-facing short link shown on printed material. */
export const PUBLIC_DOMAIN = 'reviewdot.in'

/** Configured origin; falls back to the browser's own origin in development. */
function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return `https://${PUBLIC_DOMAIN}`
}

export function displayUrl(code: string): string {
  return `${PUBLIC_DOMAIN}/r/${code}`
}

/**
 * The URL encoded into a QR code. Built from the configured origin so a code
 * printed from a preview deployment still points at the right host.
 */
export function scanUrl(code: string): string {
  return `${siteOrigin()}/r/${code}`
}
