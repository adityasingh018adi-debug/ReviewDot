import Link from 'next/link'
import { LogoMark } from '@/components/ui/Logo'

/**
 * Shown instead of the dashboard when no database is configured and nobody
 * asked for demo mode. Refusing here is the point: the alternative — serving a
 * dashboard to whoever asks because an environment variable happens to be
 * missing — is how a deployment ends up open without anyone noticing.
 */
export function NotConfigured() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <LogoMark size={44} className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">
          This workspace is not configured
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          The dashboard needs a database before it can show anything. Set{' '}
          <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then apply the migrations
          in <code className="text-ink">supabase/migrations</code>.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-faint">
          To explore the product without a database, set{' '}
          <code className="text-ink">NEXT_PUBLIC_DEMO_MODE=1</code>. That is deliberate and
          reversible; a missing variable never opens the dashboard on its own.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center rounded-2xl border border-line bg-surface px-5 text-sm font-medium text-ink"
        >
          Back to reviewdot.in
        </Link>
      </div>
    </div>
  )
}
