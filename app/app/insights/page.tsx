import type { Metadata } from 'next'
import { Insights } from '@/views/app/Insights'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'AI insights' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Insights />
    </div>
  )
}
