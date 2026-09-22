import type { Metadata } from 'next'
import { Feedback } from '@/views/app/Feedback'

export const metadata: Metadata = { title: 'Feedback' }

export default function Page() {
  return <Feedback />
}
