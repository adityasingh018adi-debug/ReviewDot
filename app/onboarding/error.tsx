'use client'

import { useEffect } from 'react'
import { LoadFailed } from '@/components/layout/LoadFailed'

/**
 * Onboarding reads the session to decide whether there is anything to set up.
 * When that read fails, the honest answer is the same as the dashboard's: this
 * is temporary, you are still signed in, try again.
 */
export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({ level: 'error', scope: 'onboarding.render', digest: error.digest }),
    )
  }, [error])

  return (
    <LoadFailed
      standalone
      onRetry={reset}
      reference={error.digest}
      title="We couldn’t reach your account"
    />
  )
}
