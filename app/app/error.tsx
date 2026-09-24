'use client'

import { useEffect } from 'react'
import { LoadFailed } from '@/components/layout/LoadFailed'

/**
 * The backstop, not the main defence.
 *
 * Two things it deliberately does not cover. It sits inside its own segment's
 * layout, so nothing `app/app/layout.tsx` throws reaches it — the layout
 * catches its own session read. And a Server Component that throws while
 * producing the first HTML has no Suspense boundary for React to recover into,
 * so that request ends as a 500 whatever is written here.
 *
 * What is left is real: anything that fails on a client navigation between
 * dashboard pages, where the boundary does run and `reset` genuinely retries.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // one line, greppable in the deployment log alongside the server's own
    console.error(
      JSON.stringify({ level: 'error', scope: 'dashboard.render', digest: error.digest }),
    )
  }, [error])

  return <LoadFailed onRetry={reset} reference={error.digest} />
}
