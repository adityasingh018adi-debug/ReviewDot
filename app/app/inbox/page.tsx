import type { Metadata } from 'next'
import { Reviews } from '@/views/app/Reviews'

export const metadata: Metadata = { title: 'Review inbox' }

export default function Page() {
  return <Reviews />
}
