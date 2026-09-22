'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', to: '/product' },
      { label: 'QR studio', to: '/product#qr' },
      { label: 'Review intelligence', to: '/product#intelligence' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Restaurants & cafés', to: '/solutions' },
      { label: 'Retail & FMCG', to: '/solutions' },
      { label: 'Clinics & salons', to: '/solutions' },
      { label: 'Multi-outlet chains', to: '/solutions' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Guides', to: '/resources' },
      { label: 'QR placement playbook', to: '/resources' },
      { label: 'Help centre', to: '/resources' },
      { label: 'Demo experience', to: '/r/demo' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            Customer Experience &amp; Review Intelligence. Collect feedback at the moment of experience, and turn
            every scan into something you can act on.
          </p>
          <p className="mt-5 text-[13px] font-medium text-ink">reviewdot.in</p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-[13px] font-semibold text-ink">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.to} className="text-[13px] text-muted transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-[12px] text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} ReviewDot. Every Scan Can Become a Review.</p>
          <p className="flex gap-5">
            <Link href="/resources" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/resources" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/resources" className="transition-colors hover:text-ink">
              Security
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
