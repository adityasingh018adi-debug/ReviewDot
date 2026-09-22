import type { Metadata } from 'next'
import { Insights } from '@/views/app/Insights'

export const metadata: Metadata = { title: 'AI insights' }

export default function Page() {
  return <Insights />
}
