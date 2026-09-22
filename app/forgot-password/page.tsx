import type { Metadata } from 'next'
import { ForgotPassword } from '@/views/marketing/Auth'
import { appMode } from '@/lib/app-mode'

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ForgotPassword mode={appMode()} />
}
