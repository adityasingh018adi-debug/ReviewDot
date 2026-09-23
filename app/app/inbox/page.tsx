import type { Metadata } from 'next'
import { Reviews } from '@/views/app/Reviews'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Review inbox' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Reviews />
    </div>
  )
}
