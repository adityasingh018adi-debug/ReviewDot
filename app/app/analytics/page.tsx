import type { Metadata } from 'next'
import { Analytics } from '@/views/app/Analytics'

export const metadata: Metadata = { title: 'Analytics' }

export default function Page() {
  return <Analytics />
}
