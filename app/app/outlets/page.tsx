import type { Metadata } from 'next'
import { Outlets } from '@/views/app/Outlets'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Outlets' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Outlets />
    </div>
  )
}
