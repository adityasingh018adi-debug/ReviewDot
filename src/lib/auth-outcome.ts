/**
 * Three answers, not two.
 *
 * `getUser()` can come back three ways, and the code that reads it has to tell
 * them apart:
 *
 *   authenticated  a user came back
 *   signed-out     the auth server answered, and the answer is nobody
 *   unavailable    the auth server could not be asked, or did not answer
 *
 * Folding the third into the second is how a working session looks broken. A
 * network blip, a timeout, a 5xx or a rate limit all produce `user: null`, and
 * a caller that only checks for null concludes the person is logged out and
 * sends them to the sign-in page — with a valid session in their cookie jar and
 * a correct password behind them. They sign in again, and it happens again.
 *
 * "Could not ask" is not an answer about who somebody is.
 */

export type AuthOutcome = 'authenticated' | 'signed-out' | 'unavailable'

type MaybeAuthError = {
  name?: string
  status?: number
  message?: string
} | null

export function classifyAuth(user: unknown, error: MaybeAuthError): AuthOutcome {
  if (user) return 'authenticated'
  if (!error) return 'signed-out'

  // The adapter says so outright: there is no session in this request.
  if (error.name === 'AuthSessionMissingError') return 'signed-out'

  // Could not reach the auth server at all.
  if (error.name === 'AuthRetryableFetchError') return 'unavailable'

  // The auth server answered and rejected the token. That is a real answer.
  if (error.status === 400 || error.status === 401 || error.status === 403) {
    return 'signed-out'
  }

  // It answered, but with trouble of its own — or with something unrecognised.
  // Either way it did not tell us this person is logged out, so we must not act
  // as though it had.
  return 'unavailable'
}

/** Thrown where a caller cannot represent "unavailable" in its return type. */
export class AuthUnavailableError extends Error {
  constructor(message = 'The authentication service could not be reached.') {
    super(message)
    this.name = 'AuthUnavailableError'
  }
}
