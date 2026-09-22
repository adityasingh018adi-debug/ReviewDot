import type { Metadata } from 'next'
import { ProductDetail } from '@/views/app/ProductDetail'

export const metadata: Metadata = { title: 'Product' }

export default function Page() {
  return <ProductDetail />
}
