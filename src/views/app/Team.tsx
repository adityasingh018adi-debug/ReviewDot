'use client'

import { useState, type FormEvent } from 'react'
import { Check, Copy, Users } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from '@/lib/permissions'
import {
  createInviteAction,
  removeMemberAction,
  revokeInviteAction,
  setMemberRoleAction,
} from '@/app-actions/workspace'
import type { PendingInvite, TeamMember } from '@/services/dashboard'

/**
 * The team, and the way somebody joins it.
 *
 * Split out of Settings because inviting people, changing what they can do and
 * removing them is a job of its own — and because the invitation flow is the
 * only way a second person gets into a workspace at all.
 */
export function Team({
  team,
  invites,
  currentUserId,
  canManageTeam,
}: {
  team: TeamMember[]
  invites: PendingInvite[]
  currentUserId: string
  canManageTeam: boolean
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Who can see this workspace, and what they can change" />

      <Card>
        <CardHeader
          title="Members"
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
        {canManageTeam ? <InviteSection invites={invites} /> : null}
      </Card>
    </div>
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

/**
 * Inviting a colleague.
 *
 * There is no mail integration yet, so the link is shown here to be sent by
 * whatever the business already uses. That is deliberate rather than a
 * placeholder: the token is what carries the invitation, and
 * `app_accept_invite` checks the signed-in account's own email against the
 * address it was issued to — so a forwarded link still cannot let the wrong
 * person in, and showing it is no weaker than mailing it.
 */
function InviteSection({ invites }: { invites: PendingInvite[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [issued, setIssued] = useState<{ email: string; url: string } | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError(null)
    setIssued(null)
    setPending(true)
    try {
      const result = await createInviteAction(data)
      if (result.error || !result.token) {
        setError(result.error ?? 'Could not create that invitation.')
        return
      }
      setIssued({
        email: String(data.get('email') ?? ''),
        url: `${window.location.origin}/join/${result.token}`,
      })
      form.reset()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="text-[13px] font-medium text-ink">Invite someone</p>
      <p className="mt-1 text-[12px] leading-relaxed text-faint">
        They join this workspace with the role you pick, using the email address you enter.
      </p>

      <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
        <Field label="Email" className="min-w-[220px] flex-1">
          <Input name="email" type="email" placeholder="colleague@example.com" required />
        </Field>
        <Field label="Role" className="w-[170px]">
          <Select name="role" defaultValue="STAFF">
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role as Role]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create invitation'}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {issued ? <IssuedLink email={issued.email} url={issued.url} /> : null}

      {invites.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-[12px] font-medium text-muted">
            Outstanding {invites.length === 1 ? 'invitation' : 'invitations'}
          </p>
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function IssuedLink({ email, url }: { email: string; url: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="mt-3 rounded-2xl border border-line bg-raised p-3.5">
      <p className="text-[13px] text-ink">
        Invitation ready for <span className="font-medium">{email}</span>. Send them this link — it
        works once, for that address, and expires in 14 days.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Input readOnly value={url} aria-label="Invitation link" className="font-mono text-[12px]" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

function InviteRow({ invite }: { invite: PendingInvite }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink">{invite.email}</p>
        <p className="text-[12px] text-faint">
          {ROLE_LABELS[invite.role as Role] ?? invite.role} · expires{' '}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          const form = new FormData()
          form.set('id', invite.id)
          setError(null)
          setPending(true)
          try {
            const result = await revokeInviteAction(form)
            if (result.error) setError(result.error)
          } finally {
            setPending(false)
          }
        }}
      >
        Withdraw
      </Button>
      {error ? (
        <p role="alert" className="w-full text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
