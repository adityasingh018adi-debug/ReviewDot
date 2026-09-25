/**
 * Which build is actually serving.
 *
 * Updated by hand with each release bundle. It exists because "a green build"
 * and "the new code is live" are different claims, and confusing them cost this
 * project several rounds of debugging a fault that had already been fixed.
 * /api/health reports it.
 */
export const BUILD_LABEL = 'no-login-demo'
