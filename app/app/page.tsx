import type { Metadata } from 'next'
import { Dashboard } from '@/views/app/Dashboard'

export const metadata: Metadata = { title: 'Dashboard' }

export default function Page() {
  return <Dashboard />
}
