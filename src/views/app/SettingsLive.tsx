'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Building2, Moon, Sun, Users } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { updateOrganizationAction } from '@/app-actions/workspace'
import type { OrganizationDetail } from '@/services/dashboard'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/**
 * Workspace settings and the team.
 *
 * The slug and short code are shown but not editable: the short code is baked
 * into every reference code already printed on a card, so changing it would
 * silently invalidate collateral sitting on tables.
 */
export function SettingsLive({
  organization,
  canManageOrg,
  teamSize,
}: {
  organization: OrganizationDetail | null
  canManageOrg: boolean
  teamSize: number
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your workspace and who can see it" />

      <Card>
        <CardHeader title="Business" subtitle="Shown to customers when they scan a code" />
        {organization ? (
          <OrganizationForm organization={organization} canManage={canManageOrg} />
        ) : (
          <p className="text-[13px] text-muted">No workspace found.</p>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Team"
          subtitle="Roles decide what each person can see and change"
          action={
            <Link href="/app/team" className="text-[12px] font-medium text-accent hover:underline">
              Manage team
            </Link>
          }
        />
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <Users size={14} className="text-faint" /> {teamSize}{' '}
          {teamSize === 1 ? 'member' : 'members'} in this workspace
        </p>
      </Card>

      <Card>
        <CardHeader title="Appearance" subtitle="Applies to this browser only" />
        <div className="grid max-w-sm grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setTheme(option)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-[13px] font-medium capitalize transition-colors',
                theme === option
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted hover:text-ink',
              )}
            >
              {option === 'light' ? <Sun size={15} /> : <Moon size={15} />} {option}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Plan" subtitle="What this workspace is on" />
        <div className="flex items-center gap-3">
          <Badge tone="positive">{organization?.planName ?? organization?.planCode ?? 'Free'}</Badge>
          {organization?.subscriptionStatus ? (
            <span className="text-[13px] text-muted">{organization.subscriptionStatus}</span>
          ) : null}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-faint">
          Usage limits and billing are not wired up yet, so nothing here is enforced.
        </p>
      </Card>
    </div>
  )
}

function OrganizationForm({
  organization,
  canManage,
}: {
  organization: OrganizationDetail
  canManage: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    setSaved(false)
    setPending(true)
    try {
      const result = await updateOrganizationAction(form)
      if (result?.error) setError(result.error)
      else setSaved(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Field label="Business name">
        <Input name="name" defaultValue={organization.name} disabled={!canManage} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Input name="category" defaultValue={organization.category ?? ''} disabled={!canManage} />
        </Field>
        <Field label="City">
          <Input name="city" defaultValue={organization.city ?? ''} disabled={!canManage} />
        </Field>
      </div>
      <Field label="Country">
        <Input name="country" defaultValue={organization.country ?? ''} disabled={!canManage} />
      </Field>

      <div className="rounded-2xl border border-line bg-raised p-4">
        <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <Building2 size={14} className="text-accent" /> Printed identifiers
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          Short code <span className="font-mono text-ink">{organization.shortCode}</span> · slug{' '}
          <span className="font-mono text-ink">{organization.slug}</span>
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-faint">
          These appear in every reference code already printed on a card, so they cannot be changed
          here.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-[13px] text-brand-600">Saved.</p> : null}

      {canManage ? (
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      ) : (
        <p className="text-[12px] text-faint">Only an owner or admin can change these.</p>
      )}
    </form>
  )
}
