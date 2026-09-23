'use client'

import { useState, type FormEvent } from 'react'
import { Building2, Users } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from '@/lib/permissions'
import { removeMemberAction, setMemberRoleAction, updateOrganizationAction } from '@/app-actions/workspace'
import type { OrganizationDetail, TeamMember } from '@/services/dashboard'

/**
 * Workspace settings and the team.
 *
 * The slug and short code are shown but not editable: the short code is baked
 * into every reference code already printed on a card, so changing it would
 * silently invalidate collateral sitting on tables.
 */
export function SettingsLive({
  organization,
  team,
  currentUserId,
  canManageOrg,
  canManageTeam,
}: {
  organization: OrganizationDetail | null
  team: TeamMember[]
  currentUserId: string
  canManageOrg: boolean
  canManageTeam: boolean
}) {
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
            <span className="flex items-center gap-1.5 text-[12px] text-faint">
              <Users size={13} /> {team.length} {team.length === 1 ? 'member' : 'members'}
            </span>
          }
        />
        <div className="space-y-2.5">
          {team.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isSelf={member.userId === currentUserId}
              canManage={canManageTeam}
            />
          ))}
        </div>
        {canManageTeam ? (
          <p className="mt-4 text-[12px] leading-relaxed text-faint">
            Inviting someone by email needs the mail integration, which is a later step. Until then a
            colleague signs up and an owner sets their role here.
          </p>
        ) : null}
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

function MemberRow({
  member,
  isSelf,
  canManage,
}: {
  member: TeamMember
  isSelf: boolean
  canManage: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const run = async (action: (form: FormData) => Promise<{ error?: string }>, form: FormData) => {
    setError(null)
    setPending(true)
    try {
      const result = await action(form)
      if (result?.error) setError(result.error)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-[12px] font-semibold text-on-accent">
          {(member.name ?? member.email ?? '?').slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">
            {member.name ?? member.email ?? 'Pending invite'}
            {isSelf ? <span className="ml-2 text-[12px] text-faint">you</span> : null}
          </p>
          <p className="truncate text-[12px] text-muted">{member.email}</p>
        </div>

        {canManage && !isSelf ? (
          <>
            <Select
              className="h-9 w-auto text-[13px]"
              defaultValue={member.role}
              disabled={pending}
              aria-label={`Role for ${member.name ?? member.email ?? 'member'}`}
              onChange={(event) => {
                const form = new FormData()
                form.set('memberId', member.id)
                form.set('role', event.target.value)
                void run(setMemberRoleAction, form)
              }}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role as Role]}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                const form = new FormData()
                form.set('memberId', member.id)
                void run(removeMemberAction, form)
              }}
            >
              Remove
            </Button>
          </>
        ) : (
          <Badge tone="neutral">{ROLE_LABELS[member.role as Role] ?? member.role}</Badge>
        )}
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-faint">
        {ROLE_DESCRIPTIONS[member.role as Role] ?? ''}
        {member.assignedOutletIds.length
          ? ` Assigned to ${member.assignedOutletIds.length} outlet${member.assignedOutletIds.length === 1 ? '' : 's'}.`
          : ''}
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
