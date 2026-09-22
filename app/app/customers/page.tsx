import type { Metadata } from 'next'
import { Customers } from '@/views/app/Customers'

export const metadata: Metadata = { title: 'Customers' }

export default function Page() {
  return <Customers />
}
