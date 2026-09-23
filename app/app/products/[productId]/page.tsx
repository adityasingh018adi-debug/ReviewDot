import type { Metadata } from 'next'
import { ProductDetail } from '@/views/app/ProductDetail'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'Product' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <ProductDetail />
    </div>
  )
}
