'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Logo } from '@/components/ui/Logo'
import { createWorkspaceAction } from '@/app-actions/onboarding'

/**
 * The step between having an account and having a workspace.
 *
 * One form, because the database does the three inserts atomically:
 * organization, the caller's OWNER membership, and the first outlet. Splitting
 * it across screens would let someone end up with an organization they are not
 * a member of.
 */
export function Onboarding() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    setPending(true)
    try {
      // On success this redirects and never resolves.
      const result = await createWorkspaceAction(form)
      if (result?.error) setError(result.error)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-10 text-[28px] font-semibold tracking-tight text-ink">
          Set up your workspace
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Your business and its first outlet. You can add more outlets, products and QR campaigns
          straight afterwards.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label="Business name" hint="Shown to customers when they scan a code.">
            <Input name="organizationName" placeholder="Love & Latte" required />
          </Field>

          <Field label="Category" hint="Optional.">
            <Input name="category" placeholder="Café & Patisserie" />
          </Field>

          <div className="rounded-2xl border border-line bg-raised p-4">
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <Building2 size={15} className="text-accent" /> Your first outlet
            </p>
            <div className="mt-3 space-y-3">
              <Field label="Outlet name">
                <Input name="outletName" placeholder="Thane" required />
              </Field>
              <Field label="City">
                <Input name="city" placeholder="Thane West" />
              </Field>
              <Field label="Country">
                <Input name="country" placeholder="India" />
              </Field>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-[13px] leading-relaxed text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating…' : 'Create workspace'} <ArrowRight size={16} />
          </Button>
        </form>

        <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-faint">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          Outlets are how ReviewDot scopes everything else — QR codes, feedback, analytics and who on
          your team can see what.
        </p>
      </div>
    </div>
  )
}
