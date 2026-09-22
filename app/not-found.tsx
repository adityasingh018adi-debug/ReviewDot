import Link from 'next/link'
import { LogoMark } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6">
      <div className="text-center">
        <LogoMark size={46} className="mx-auto" />
        <p className="mt-6 font-display text-[64px] font-semibold leading-none tracking-tight text-ink">404</p>
        <h1 className="mt-3 text-lg font-semibold tracking-tight text-ink">This page doesn’t exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
          The link may be outdated. If you scanned a QR code, ask the outlet for a current one.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-2xl bg-accent px-5 text-sm font-medium text-on-accent"
          >
            Back to home
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center rounded-2xl border border-line bg-surface px-5 text-sm font-medium text-ink"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
