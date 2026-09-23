import type { Metadata } from 'next'
import { Analytics } from '@/views/app/Analytics'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Analytics' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Analytics />
    </div>
  )
}
