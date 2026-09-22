import type { Metadata } from 'next'
import { Login } from '@/views/marketing/Auth'
import { appMode } from '@/lib/app-mode'
import { safeNextPath } from '@/lib/site-url'

export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false, follow: true },
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <Login mode={appMode()} next={safeNextPath(next)} />
}
