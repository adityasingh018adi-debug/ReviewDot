import type { Metadata } from 'next'
import { ResetPassword } from '@/views/marketing/Auth'
import { appMode } from '@/lib/app-mode'

/**
 * Reached from the emailed reset link, which lands on /auth/callback first so a
 * recovery session is in place before this renders. Dynamic because that
 * session is read per request.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ResetPassword mode={appMode()} />
}
