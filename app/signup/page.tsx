import type { Metadata } from 'next'
import { Signup } from '@/views/marketing/Auth'
import { appMode } from '@/lib/app-mode'
import { safeNextPath } from '@/lib/site-url'

export const metadata: Metadata = {
  title: 'Start free',
  description:
    'Create your ReviewDot workspace: one outlet, ten QR campaigns and unlimited reviews, free forever.',
  alternates: { canonical: '/signup' },
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  // Someone arriving from an invitation is joining a workspace that already
  // exists, so they must not be sent to onboarding to create another one.
  // safeNextPath refuses anything that would leave the site.
  return <Signup mode={appMode()} next={safeNextPath(next, '/onboarding')} />
}
