import type { Metadata } from 'next'
import { Product } from '@/views/marketing/Product'

export const metadata: Metadata = {
  title: 'Product',
  description:
    'QR campaigns, an AI review writer that only uses the customer’s own words, multi-outlet analytics and review intelligence — everything between a printed code and a better rating.',
  alternates: { canonical: '/product' },
}

export default function Page() {
  return <Product />
}
