'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import { Logo } from '@/components/ui/Logo'
import { TableCard } from '@/components/qr/TableCard'
import { demoQR } from '@/lib/data'
import type { AppMode } from '@/lib/app-mode'
import {
  requestPasswordResetAction,
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  updatePasswordAction,
  type AuthResult,
} from '@/app-actions/auth'

/**
 * Sign-in, sign-up and password reset.
 *
 * Each screen renders for whichever mode the deployment is in, decided on the
 * server and passed down:
 *
 *   live          real Supabase accounts
 *   demo          the seeded workspace, with the form clearly labelled as such
 *   unconfigured  no accounts are possible, and the screen says so rather than
 *                 pretending to accept a password
 *
 * Server actions are called directly from the submit handler rather than
 * through useFormState, which needs React 19; this project is on 18.
 */

type Props = { mode: AppMode; next?: string }

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8 space-y-4">{children}</div>
          <div className="mt-6 text-[13px] text-muted">{footer}</div>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-surface px-12 lg:flex">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative text-center">
          <TableCard code={demoQR.code} className="mx-auto w-[280px]" />
          <p className="mx-auto mt-8 max-w-xs text-[14px] leading-relaxed text-muted">
            Print one card, put it on a table, and the first reviews usually land the same evening.
          </p>
          <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
            {['No card required', 'Live in 10 minutes', 'Cancel anytime'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13px] text-ink-soft">
                <Check size={15} className="text-accent" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Notice({ result }: { result: AuthResult }) {
  if (result.error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-[13px] leading-relaxed text-danger">
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        {result.error}
      </p>
    )
  }
  if (result.notice) {
    return (
      <p role="status" className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
        <Info size={15} className="mt-0.5 shrink-0 text-accent" />
        {result.notice}
      </p>
    )
  }
  return null
}

function Unavailable() {
  return (
    <div className="rounded-2xl border border-line bg-raised p-4">
      <p className="text-[13px] leading-relaxed text-ink-soft">
        This deployment has no database configured, so accounts are not available. Set{' '}
        <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code className="text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in, or{' '}
        <code className="text-ink">NEXT_PUBLIC_DEMO_MODE=1</code> to explore the seeded workspace.
      </p>
    </div>
  )
}

function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogleAction}>
      <input type="hidden" name="next" value={next ?? '/app'} />
      <Button type="submit" variant="secondary" className="w-full">
        <GoogleGlyph size={16} /> Continue with Google
      </Button>
    </form>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[12px] text-faint">or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

/** Shared submit plumbing: call the action, show whatever it says. */
function useAction(action: (form: FormData) => Promise<AuthResult>) {
  const [result, setResult] = useState<AuthResult>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setResult({})
    setPending(true)
    try {
      // A successful action redirects, in which case this never resolves.
      const outcome = await action(form)
      if (outcome) setResult(outcome)
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  return { result, pending, onSubmit }
}

/* ------------------------------------------------------------------ login */

export function Login({ mode, next }: Props) {
  const router = useRouter()
  const { result, pending, onSubmit } = useAction(signInAction)

  const footer = (
    <>
      New to ReviewDot?{' '}
      <Link href="/signup" className="font-medium text-accent hover:underline">
        Create an account
      </Link>
    </>
  )

  if (mode === 'unconfigured') {
    return (
      <AuthShell title="Welcome back" subtitle="Log in to your ReviewDot workspace." footer={footer}>
        <Unavailable />
      </AuthShell>
    )
  }

  if (mode === 'demo') {
    return (
      <AuthShell
        title="Welcome back"
        subtitle="Log in to your ReviewDot workspace."
        footer={footer}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            router.push('/app')
          }}
        >
          <Field label="Work email">
            <Input type="email" name="email" defaultValue="ritika@loveandlatte.in" required />
          </Field>
          <Field label="Password">
            <Input type="password" name="password" defaultValue="demo-workspace" required />
          </Field>
          <Button type="submit" className="w-full">
            Log in <ArrowRight size={16} />
          </Button>
        </form>
        <p className="text-[12px] text-faint">
          This deployment runs in demo mode — any credentials open the Love &amp; Latte workspace.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your ReviewDot workspace." footer={footer}>
      <GoogleButton next={next} />
      <Divider />
      <form className="space-y-4" onSubmit={onSubmit}>
        <input type="hidden" name="next" value={next ?? '/app'} />
        <Field label="Work email">
          <Input type="email" name="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" autoComplete="current-password" required />
        </Field>
        <Notice result={result} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Logging in…' : 'Log in'} <ArrowRight size={16} />
        </Button>
      </form>
      <Link href="/forgot-password" className="block text-[13px] text-muted hover:text-ink">
        Forgot your password?
      </Link>
    </AuthShell>
  )
}

/* ----------------------------------------------------------------- signup */

export function Signup({ mode, next }: Props) {
  const router = useRouter()
  const { result, pending, onSubmit } = useAction(signUpAction)

  const footer = (
    <>
      Already have an account?{' '}
      <Link
        href={next && next !== '/onboarding' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
        className="font-medium text-accent hover:underline"
      >
        Log in
      </Link>
    </>
  )

  const subtitle = 'One outlet, ten QR codes and unlimited reviews — free forever.'

  if (mode === 'unconfigured') {
    return (
      <AuthShell title="Start free" subtitle={subtitle} footer={footer}>
        <Unavailable />
      </AuthShell>
    )
  }

  if (mode === 'demo') {
    return (
      <AuthShell title="Start free" subtitle={subtitle} footer={footer}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            router.push('/app')
          }}
        >
          <Field label="Business name">
            <Input defaultValue="Love & Latte" required />
          </Field>
          <Field label="Work email">
            <Input type="email" placeholder="you@business.in" required />
          </Field>
          <Field label="City">
            <Input defaultValue="Thane" required />
          </Field>
          <Button type="submit" className="w-full">
            Create workspace <ArrowRight size={16} />
          </Button>
        </form>
        <p className="text-[12px] leading-relaxed text-faint">
          This deployment runs in demo mode — nothing is saved.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Start free" subtitle={subtitle} footer={footer}>
      <GoogleButton next={next ?? '/onboarding'} />
      <Divider />
      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Someone arriving from an invitation joins a workspace that already
            exists, so they must not be sent to onboarding to create another. */}
        <input type="hidden" name="next" value={next ?? '/onboarding'} />
        <Field label="Your name">
          <Input name="fullName" autoComplete="name" required />
        </Field>
        <Field label="Work email">
          <Input type="email" name="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input type="password" name="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Notice result={result} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'} <ArrowRight size={16} />
        </Button>
      </form>
      <p className="text-[12px] leading-relaxed text-faint">
        By creating an account you agree to the ReviewDot terms. No card required.
      </p>
    </AuthShell>
  )
}

/* -------------------------------------------------------- password reset */

export function ForgotPassword({ mode }: Props) {
  const { result, pending, onSubmit } = useAction(requestPasswordResetAction)

  const footer = (
    <Link href="/login" className="font-medium text-accent hover:underline">
      Back to log in
    </Link>
  )

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footer={footer}
    >
      {mode === 'live' ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Work email">
            <Input type="email" name="email" autoComplete="email" required />
          </Field>
          <Notice result={result} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Sending…' : 'Send reset link'} <ArrowRight size={16} />
          </Button>
        </form>
      ) : (
        <Unavailable />
      )}
    </AuthShell>
  )
}

export function ResetPassword({ mode }: Props) {
  const { result, pending, onSubmit } = useAction(updatePasswordAction)

  const footer = (
    <Link href="/login" className="font-medium text-accent hover:underline">
      Back to log in
    </Link>
  )

  return (
    <AuthShell title="Choose a new password" subtitle="This replaces your old one." footer={footer}>
      {mode === 'live' ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="New password" hint="At least 8 characters.">
            <Input type="password" name="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <Notice result={result} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving…' : 'Save password'} <ArrowRight size={16} />
          </Button>
        </form>
      ) : (
        <Unavailable />
      )}
    </AuthShell>
  )
}
