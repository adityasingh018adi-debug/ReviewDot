import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeScript } from '@/components/layout/ThemeScript'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reviewdot.in'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ReviewDot — AI Customer Review & Feedback Platform',
    template: '%s · ReviewDot',
  },
  description:
    'Turn every customer experience into a review. ReviewDot collects feedback from a QR scan, drafts a review in the customer’s own words, and shows every outlet how it is performing.',
  keywords: [
    'customer feedback platform',
    'QR code reviews',
    'AI review writing',
    'Google review management',
    'multi-outlet analytics',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'ReviewDot',
    url: SITE_URL,
    title: 'ReviewDot — Turn Every Customer Experience Into a Review',
    description:
      'AI-powered customer feedback and review management for businesses with one outlet or hundreds.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewDot — Turn Every Customer Experience Into a Review',
    description:
      'AI-powered customer feedback and review management for businesses with one outlet or hundreds.',
  },
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbf9' },
    { media: '(prefers-color-scheme: dark)', color: '#080a09' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
