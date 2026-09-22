/**
 * The origin this deployment is reachable at.
 *
 * Used to build OAuth and password-reset redirect targets. Those go to Supabase
 * and come back as a browser redirect, so the value must be an origin we own —
 * it is read from configuration and never from a request header, which a caller
 * could set to send the round trip somewhere else.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  return 'http://localhost:3000'
}

/** An absolute URL on this site. Path is always treated as relative to it. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}/${path.replace(/^\/+/, '')}`
}

/**
 * Sanitises a `?next=` value before redirecting to it. Only same-site absolute
 * paths survive; anything protocol-relative, absolute or otherwise off-site
 * falls back to the dashboard. Without this the login form is an open redirect.
 */
export function safeNextPath(value: string | null | undefined, fallback = '/app'): string {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  // `//evil.com` and `/\evil.com` are both read as protocol-relative by browsers
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
