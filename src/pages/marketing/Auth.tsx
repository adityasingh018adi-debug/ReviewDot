import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Logo } from '@/components/ui/Logo'
import { TableCard } from '@/components/qr/TableCard'
import { demoQR } from '@/lib/data'
import { useApp } from '@/store/app'

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
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

export function Login() {
  const navigate = useNavigate()
  const setSignedIn = useApp((s) => s.setSignedIn)
  const [email, setEmail] = useState('ritika@loveandlatte.in')

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your ReviewDot workspace."
      footer={
        <>
          New to ReviewDot?{' '}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSignedIn(true)
          navigate('/app')
        }}
      >
        <Field label="Work email">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" defaultValue="demo-workspace" required />
        </Field>
        <Button type="submit" className="w-full">
          Log in <ArrowRight size={16} />
        </Button>
      </form>
      <p className="text-[12px] text-faint">
        This is a demo workspace — any credentials open the Love &amp; Latte dashboard.
      </p>
    </AuthShell>
  )
}

export function Signup() {
  const navigate = useNavigate()
  const setSignedIn = useApp((s) => s.setSignedIn)

  return (
    <AuthShell
      title="Start free"
      subtitle="One outlet, ten QR codes and unlimited reviews — free forever."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSignedIn(true)
          navigate('/app')
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
        By creating a workspace you agree to the ReviewDot terms. No card required.
      </p>
    </AuthShell>
  )
}
