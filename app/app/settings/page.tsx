import type { Metadata } from 'next'
import { Settings } from '@/views/app/Settings'

export const metadata: Metadata = { title: 'Settings' }

export default function Page() {
  return <Settings />
}
