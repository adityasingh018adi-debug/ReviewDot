'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { serverClient } from '@/services/supabase.server'
import { isSupabaseConfigured } from '@/services/supabase'

/**
 * Creating the first workspace.
 *
 * This calls app_create_organization() rather than inserting three rows,
 * because organization + owner membership + first outlet have to happen
 * together or not at all, and because `organizations` deliberately has no
 * insert policy — the function is the only sanctioned way in, and it checks
 * the caller itself.
 */

export type OnboardingResult = { error?: string }

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export async function createWorkspaceAction(form: FormData): Promise<OnboardingResult> {
  if (!isSupabaseConfigured()) {
    return { error: 'Workspaces are not available on this deployment yet.' }
  }

  const organizationName = field(form, 'organizationName')
  const outletName = field(form, 'outletName')

  if (!organizationName) return { error: 'Enter your business name.' }
  if (!outletName) return { error: 'Enter the name of your first outlet.' }

  const supabase = await serverClient()
  const { error } = await supabase.rpc('app_create_organization', {
    org_name: organizationName,
    outlet_name: outletName,
    org_category: field(form, 'category') || null,
    outlet_city: field(form, 'city') || null,
    outlet_country: field(form, 'country') || null,
  })

  if (error) {
    // The function raises unique_violation when the caller already owns one.
    if (error.code === '23505') {
      return { error: 'This account already has a workspace.' }
    }
    return { error: error.message }
  }

  revalidatePath('/app', 'layout')
  redirect('/app')
}
