import type { Metadata } from 'next'
import { Login } from '@/views/marketing/Auth'

export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false, follow: true },
}

export default function Page() {
  return <Login />
}
