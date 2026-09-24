import { describe, expect, it } from 'vitest'
import { classifyAuth } from './auth-outcome'

/**
 * The distinction this file exists to make. Every case below that returns
 * 'unavailable' used to return null and be read as "logged out", which is what
 * sent people back to the sign-in page holding a valid session.
 */
describe('classifyAuth', () => {
  it('reports a user as authenticated', () => {
    expect(classifyAuth({ id: 'u1' }, null)).toBe('authenticated')
  })

  it('reports no user and no error as signed out', () => {
    expect(classifyAuth(null, null)).toBe('signed-out')
  })

  it('believes the auth server when it says there is no session', () => {
    expect(classifyAuth(null, { name: 'AuthSessionMissingError' })).toBe('signed-out')
  })

  it('believes the auth server when it rejects the token', () => {
    for (const status of [400, 401, 403]) {
      expect(classifyAuth(null, { name: 'AuthApiError', status }), String(status)).toBe('signed-out')
    }
  })

  it('does not sign anyone out because the network failed', () => {
    expect(classifyAuth(null, { name: 'AuthRetryableFetchError', message: 'fetch failed' })).toBe(
      'unavailable',
    )
  })

  it('does not sign anyone out because the auth server is struggling', () => {
    for (const status of [429, 500, 502, 503, 504]) {
      expect(classifyAuth(null, { name: 'AuthApiError', status }), String(status)).toBe('unavailable')
    }
  })

  it('treats anything it does not recognise as unavailable, not as signed out', () => {
    // the safe direction: a session that survives a mystery is recoverable,
    // one that is thrown away is not
    expect(classifyAuth(null, { name: 'SomethingNew' })).toBe('unavailable')
  })
})
