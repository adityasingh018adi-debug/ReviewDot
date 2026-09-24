'use client'

import Link from 'next/link'
import { AlertCircle, RotateCw } from 'lucide-react'
import { LogoMark } from '@/components/ui/Logo'

/**
 * "We could not load this" — said once, in one place.
 *
 * It exists mainly for one case: the authentication service could not be
 * reached. That used to surface as the login page, because "could not ask" and
 * "not signed in" were the same value — so a person with a valid session and a
 * correct password was told, in effect, to try signing in again. Something they
 * can retry is the honest answer, and saying they are still signed in is the
 * part that stops them from typing their password a third time.
 *
 * Two callers, because Next's error boundaries do not catch what their own
 * layout throws: `app/app/error.tsx` for anything below the dashboard layout,
 * and the layout itself for its own session read. The layout has no session to
 * build the navigation from, so it renders this `standalone`.
 *
 * Next replaces server error messages with a generic one in production and
 * keeps only the digest, so this never tries to name the cause — and must not,
 * since a raw adapter error is not something to show a customer.
 */
export function LoadFailed({
  onRetry,
  reference,
  standalone = false,
  title = 'We couldn’t load your dashboard',
}: {
  /** The boundary's `reset`. Without one, reloading is the same retry. */
  onRetry?: () => void
  reference?: string
  standalone?: boolean
  title?: string
}) {
  const retry = onRetry ?? (() => window.location.reload())

  return (
    <div
      className={
        standalone
          ? 'grid min-h-[100dvh] place-items-center bg-canvas px-6 text-center'
          : 'flex min-h-[60vh] flex-col items-center justify-center px-6 text-center'
      }
    >
      <div className="max-w-md">
        {standalone ? (
          <LogoMark size={44} className="mx-auto" />
        ) : (
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <AlertCircle size={22} />
          </span>
        )}
        <h1 className="mt-5 font-display text-[22px] font-bold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          This is usually temporary. Your account and your data are unaffected — you have not been
          signed out.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            <RotateCw size={15} /> Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-line px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-raised"
          >
            Back to site
          </Link>
        </div>
        {reference ? (
          <p className="mt-6 font-mono text-[11px] text-faint">Reference {reference}</p>
        ) : null}
      </div>
    </div>
  )
}
