import type { Metadata } from 'next'
import { Outlets } from '@/views/app/Outlets'

export const metadata: Metadata = { title: 'Outlets' }

export default function Page() {
  return <Outlets />
}
