'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { signOutAction } from '@/app-actions/auth'
import { acceptInviteAction } from '@/app-actions/workspace'

/**
 * The accept step, for someone who is already signed in.
 *
 * The address comparison here is a courtesy, not the check: it explains the
 * refusal before the round trip. `app_accept_invite` compares the caller's own
 * profile email against the invited address itself, so signing in as somebody
 * else and pressing the button anyway gets an error, not a membership.
 */
export function AcceptInvite({
  token,
  organizationName,
  invitedEmail,
  signedInEmail,
}: {
  token: string
  organizationName: string
  invitedEmail: string
  signedInEmail: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const matches = signedInEmail.trim().toLowerCase() === invitedEmail.trim().toLowerCase()

  if (!matches) {
    return (
      <div className="mt-6 space-y-3">
        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          You are signed in as {signedInEmail}. This invitation was sent to {invitedEmail}, and only
          that account can accept it.
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary">
            Log out and switch account
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3">
      <Button
        disabled={pending}
        onClick={async () => {
          setError(null)
          setPending(true)
          try {
            const result = await acceptInviteAction(token)
            if (result.error) {
              setError(result.error)
              return
            }
            router.replace('/app')
          } catch {
            setError('Something went wrong. Please try again.')
          } finally {
            setPending(false)
          }
        }}
      >
        {pending ? 'Joining…' : `Join ${organizationName}`}
      </Button>
      {error ? (
        <p role="alert" className="text-[13px] leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
