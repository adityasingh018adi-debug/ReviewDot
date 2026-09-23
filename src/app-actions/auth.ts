'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { serverClient } from '@/services/supabase.server'
import { isSupabaseConfigured } from '@/services/supabase'
import { absoluteUrl, safeNextPath } from '@/lib/site-url'

/**
 * Authentication, as server actions.
 *
 * Every one of these returns a message rather than throwing, so the form can
 * show it, except where the outcome is a redirect. Messages are deliberately
 * vague about whether an account exists: "check your email" and "those details
 * did not match" leak nothing to someone probing for registered addresses.
 */

export type AuthResult = { error?: string; notice?: string }

const NOT_CONFIGURED: AuthResult = {
  error: 'Accounts are not available on this deployment yet.',
}

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function validate(email: string, password: string): string | null {
  if (!email || !email.includes('@')) return 'Enter a valid email address.'
  if (password.length < 8) return 'Use a password of at least 8 characters.'
  return null
}

export async function signUpAction(form: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED

  const email = field(form, 'email').toLowerCase()
  const password = field(form, 'password')
  const fullName = field(form, 'fullName')

  const invalid = validate(email, password)
  if (invalid) return { error: invalid }

  // Where to land afterwards. Onboarding for someone starting a business of
  // their own; the invitation they came from, if they came from one. Anything
  // that would leave the site is refused by safeNextPath.
  const next = safeNextPath(field(form, 'next'), '/onboarding')

  const supabase = await serverClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  })

  if (error) return { error: error.message }

  // A confirmed session means email confirmation is off; otherwise they have
  // mail waiting. The profile row is created by the database trigger either way.
  if (data.session) redirect(next)

  return { notice: 'Check your email for a link to confirm your address.' }
}

export async function signInAction(form: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED

  const email = field(form, 'email').toLowerCase()
  const password = field(form, 'password')
  if (!email || !password) return { error: 'Enter your email and password.' }

  const supabase = await serverClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // One message for a wrong password and an unknown address alike.
  if (error) return { error: 'Those details did not match an account.' }

  revalidatePath('/', 'layout')
  redirect(safeNextPath(field(form, 'next')))
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await serverClient()
    await supabase.auth.signOut()
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function requestPasswordResetAction(form: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED

  const email = field(form, 'email').toLowerCase()
  if (!email || !email.includes('@')) return { error: 'Enter a valid email address.' }

  const supabase = await serverClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl('/auth/callback?next=/reset-password'),
  })

  // Always the same answer, whether or not that address has an account.
  return { notice: 'If that address has an account, a reset link is on its way.' }
}

export async function updatePasswordAction(form: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED

  const password = field(form, 'password')
  const confirm = field(form, 'confirmPassword')
  if (password.length < 8) return { error: 'Use a password of at least 8 characters.' }
  if (password !== confirm) return { error: 'Those passwords do not match.' }

  const supabase = await serverClient()

  // The reset link put a recovery session in place; without one this is someone
  // opening the page directly and must not be allowed to set a password.
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { error: 'This reset link has expired. Request a new one.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/app')
}

/** Starts the Google round trip. Returns nothing — it redirects to Google. */
export async function signInWithGoogleAction(form: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect('/login?error=unavailable')

  const next = safeNextPath(field(form, 'next'))
  const supabase = await serverClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`) },
  })

  if (error || !data.url) redirect('/login?error=google')
  redirect(data.url)
}
