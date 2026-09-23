import type { Metadata } from 'next'
import { Settings } from '@/views/app/Settings'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Settings' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Settings />
    </div>
  )
}
