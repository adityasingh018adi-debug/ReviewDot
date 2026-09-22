import type { Metadata } from 'next'
import { Signup } from '@/views/marketing/Auth'

export const metadata: Metadata = {
  title: 'Start free',
  description: 'Create your ReviewDot workspace: one outlet, ten QR campaigns and unlimited reviews, free forever.',
  alternates: { canonical: '/signup' },
}

export default function Page() {
  return <Signup />
}
