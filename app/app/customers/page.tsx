import type { Metadata } from 'next'
import { Customers } from '@/views/app/Customers'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Customers' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Customers />
    </div>
  )
}
