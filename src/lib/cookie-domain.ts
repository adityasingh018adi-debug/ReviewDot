/**
 * Which domain the session cookie belongs to.
 *
 * Supabase writes its session cookie with no `domain`, which makes it
 * host-only: a cookie set on `reviewdot.in` is never sent to
 * `www.reviewdot.in`, and the reverse. Any deployment that answers on both
 * names — or redirects between them — therefore loses the session on the very
 * next request after a sign-in. The password was right, the cookie was written,
 * and the dashboard still says nobody is signed in.
 *
 * Widening the cookie to the registrable domain makes both names share one
 * session, which is what a person expects from typing either.
 *
 * Deliberately conservative. A cookie scoped too widely is a real problem —
 * `.co.uk` or `.vercel.app` would be shared with strangers, and browsers reject
 * those anyway — so this only widens the one shape it can be sure of: a bare
 * two-label domain, or that domain with `www.` in front. Anything else
 * (a subdomain deployment, localhost, an IP address) keeps the host-only
 * default, which is already correct there.
 */
export function sessionCookieDomain(host: string | null | undefined): string | undefined {
  if (!host) return undefined

  const name = host.split(':')[0]!.trim().toLowerCase()
  if (!name || name === 'localhost') return undefined

  // an IP address is never a domain a cookie can be widened to
  if (/^[\d.]+$/.test(name) || name.includes('[')) return undefined

  const labels = name.replace(/^www\./, '').split('.')
  if (labels.length !== 2) return undefined
  if (labels.some((label) => label.length === 0)) return undefined

  return `.${labels.join('.')}`
}
