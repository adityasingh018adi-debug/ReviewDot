import type { Metadata } from 'next'
import { Products } from '@/views/app/Products'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Products' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <Products />
    </div>
  )
}
