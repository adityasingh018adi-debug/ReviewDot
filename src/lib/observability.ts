/**
 * Error reporting for the customer flow.
 *
 * Every database write in the scan path used to be wrapped in a bare `catch {}`
 * with a comment explaining that telemetry must not break the customer's
 * journey. That part was right — a failed write must never stop someone leaving
 * feedback. What was wrong is that the failure then left no trace at all: in
 * production you would lose feedback and never learn that you had.
 *
 * So failures are still swallowed, but they are recorded first, as one line of
 * structured JSON that Hostinger's logs keep.
 *
 * What goes in the record is deliberately narrow. Ids and counts, never content:
 * a customer's comment, name, email or phone must not end up in a log file that
 * outlives the row it came from and sits outside every policy protecting it.
 */

export type ErrorScope =
  | 'scan.record'
  | 'scan.session'
  | 'feedback.submit'
  | 'draft.save'
  | 'draft.approve'
  | 'review.event'
  | 'outlet.write'
  | 'campaign.write'

/** Ids and counts only. Anything free-text belongs in the database, not here. */
export type ErrorMeta = Record<string, string | number | boolean | null | undefined>

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'unknown error'
}

export function reportError(scope: ErrorScope, error: unknown, meta: ErrorMeta = {}): void {
  const record = {
    level: 'error',
    scope,
    message: messageOf(error),
    at: new Date().toISOString(),
    ...meta,
  }
  // console.error is the transport: Hostinger captures stdout/stderr per
  // deployment, so this is greppable without adding a reporting dependency.
  console.error(JSON.stringify(record))
}

/**
 * Runs a side effect that must not be allowed to break the caller. Returns the
 * value, or undefined if it threw — and either way the caller keeps going.
 */
export async function attempt<T>(
  scope: ErrorScope,
  meta: ErrorMeta,
  run: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await run()
  } catch (error) {
    reportError(scope, error, meta)
    return undefined
  }
}
