import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { useApp } from '@/store/app'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/product', label: 'Product' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/resources', label: 'Resources' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const theme = useApp((s) => s.theme)
  const toggleTheme = useApp((s) => s.toggleTheme)

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
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2 text-[14px] font-medium transition-colors',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="hidden rounded-xl p-2.5 text-muted transition-colors hover:bg-raised hover:text-ink sm:block"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            to="/login"
            className="hidden rounded-xl px-3 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-raised sm:block"
          >
            Log in
          </Link>
          <ButtonLink to="/signup" size="sm" className="hidden sm:inline-flex">
            Start Free
          </ButtonLink>
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
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-raised"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <ButtonLink to="/login" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Log in
              </ButtonLink>
              <ButtonLink to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                Start Free
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
