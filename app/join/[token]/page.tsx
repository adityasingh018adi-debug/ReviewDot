import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { AcceptInvite } from '@/views/marketing/AcceptInvite'
import { appMode } from '@/lib/app-mode'
import { getWorkspaceSession } from '@/services/auth.server'
import { serverClient } from '@/services/supabase.server'
import { ROLE_LABELS, type Role } from '@/lib/permissions'

/**
 * Accepting an invitation.
 *
 * Public, because the person being invited usually has no account yet — the
 * preview comes from `app_invite_preview`, which is granted to `anon` and
 * returns nothing but the workspace name, the invited address and the role. It
 * is the only thing a token buys without signing in: `app_accept_invite`
 * separately requires that the caller's own profile email matches the address
 * the invitation was issued to, so forwarding this link to someone else gets
 * them a page and no membership.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join a workspace',
  robots: { index: false, follow: false },
}

type Preview = { organization_name: string; email: string; role: string }

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <Logo />
        <div className="mt-10 rounded-3xl border border-line bg-surface p-7 shadow-card">{children}</div>
      </div>
    </div>
  )
}

function Dead({ detail }: { detail: string }) {
  return (
    <Shell>
      <h1 className="text-[22px] font-semibold tracking-tight text-ink">
        This invitation is no longer valid
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{detail}</p>
      <Link
        href="/"
        className="mt-6 inline-block text-[13px] font-medium text-accent hover:underline"
      >
        Back to ReviewDot
      </Link>
    </Shell>
  )
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (appMode() !== 'live') {
    return <Dead detail="This deployment has no accounts, so there is nothing to join." />
  }

  const supabase = await serverClient()
  const { data, error } = await supabase.rpc('app_invite_preview', { p_token: token })
  const invite = (Array.isArray(data) ? (data[0] as Preview | undefined) : undefined) ?? null

  if (error || !invite) {
    return (
      <Dead detail="It may have already been used, been withdrawn, or expired. Ask whoever invited you for a fresh link." />
    )
  }

  const roleLabel = ROLE_LABELS[invite.role as Role] ?? invite.role
  // Only used to decide which call to action to show. If it cannot be read,
  // show the signed-out one — accepting re-checks the caller anyway, and the
  // invitee most often has no account yet.
  const workspace = await getWorkspaceSession().catch(() => null)

  return (
    <Shell>
      <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
        <MailCheck size={20} />
      </span>
      <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">
        Join {invite.organization_name}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        You have been invited as <span className="font-medium text-ink">{roleLabel}</span>, at{' '}
        <span className="font-medium text-ink">{invite.email}</span>.
      </p>

      {workspace ? (
        <AcceptInvite
          token={token}
          organizationName={invite.organization_name}
          invitedEmail={invite.email}
          signedInEmail={workspace.user.email}
        />
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-[13px] leading-relaxed text-faint">
            Sign in with {invite.email} to accept. If you have not used ReviewDot before, create an
            account with that address first — the invitation only opens for the address it was sent
            to.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/login?next=/join/${encodeURIComponent(token)}`}
              className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent"
            >
              Log in
            </Link>
            <Link
              href={`/signup?next=/join/${encodeURIComponent(token)}`}
              className="rounded-xl border border-line px-4 py-2.5 text-[13px] font-medium text-ink"
            >
              Create an account
            </Link>
          </div>
        </div>
      )}
    </Shell>
  )
}
