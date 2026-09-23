/**
 * Content Security Policy.
 *
 * Honest about what this does and does not stop.
 *
 * `script-src` has to include 'unsafe-inline': Next hydrates through inline
 * bootstrap scripts, and the theme script runs before paint to avoid a white
 * flash. Locking those down means a per-request nonce, which means every page
 * becomes dynamic — including the marketing pages, whose whole job is to be
 * static and crawlable. That trade is not worth it here, so this policy does
 * not claim to stop injected inline script.
 *
 * What it does stop is everything around it, which is where the realistic
 * attacks on this app live: no third-party script origins, no framing, no
 * plugins, no arbitrary form target, no base-tag rewrite, and connections
 * limited to this origin plus Supabase. Combined with the fact that the app has
 * no HTML sink — the only two dangerouslySetInnerHTML uses are a static string
 * and JSON.stringify of a constant — this is a meaningful boundary rather than
 * a decorative header.
 */
const supabaseOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return ''
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
})()

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  // Tailwind and framer-motion both set style attributes at runtime
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace('https://', 'wss://')}`.trim(),
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  'upgrade-insecure-requests',
]
  .filter(Boolean)
  .join('; ')

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Lint is part of the build now. It runs as its own CI step too, but a
    // local `npm run build` that quietly skips it is a build that disagrees
    // with CI, and the disagreement is always discovered at the worst moment.
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            // Two years, subdomains included. Deliberately no `preload`: that
            // ships the domain to a browser-baked list which takes months to
            // get out of, and is not a decision to make in a config file.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
      {
        // The scan page is the one thing customers reach from the physical
        // world; it must never be cached by an intermediary with another
        // outlet's copy.
        source: '/r/:code*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}
