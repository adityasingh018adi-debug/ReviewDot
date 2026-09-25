'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { useTheme } from '@/lib/theme'
import { isDemo } from '@/lib/app-mode'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/resources', label: 'Resources' },
]

export function SiteNav() {
  /*
   * No "Log in" in the header, in any mode.
   *
   * It is still reachable at /login, and live mode still sends an
   * unauthenticated visitor there — taking the route away would make the
   * dashboard unreachable. This only stops the marketing site advertising it.
   *
   * Demo mode goes further and has no sign-up either, because it has no
   * accounts at all. NEXT_PUBLIC_* is inlined at build time, so this is the
   * same answer here as it is on the server.
   */
  const demo = isDemo()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-line bg-canvas/85 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-xl px-3 py-2 text-[14px] font-medium transition-colors',
                  pathname === link.href ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="hidden rounded-xl p-2.5 text-muted transition-colors hover:bg-raised hover:text-ink sm:block"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {demo ? (
            <ButtonLink href="/app" size="sm">
              Open dashboard
            </ButtonLink>
          ) : (
            <ButtonLink href="/signup" size="sm" className="hidden sm:inline-flex">
              Start Free
            </ButtonLink>
          )}
          <button
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="rounded-xl p-2.5 text-ink transition-colors hover:bg-raised md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-line bg-canvas md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-raised"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <ButtonLink
                href={demo ? '/app' : '/signup'}
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                {demo ? 'Open dashboard' : 'Start Free'}
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
