import type { Metadata } from 'next'
import { Products } from '@/views/app/Products'

export const metadata: Metadata = { title: 'Products' }

export default function Page() {
  return <Products />
}
