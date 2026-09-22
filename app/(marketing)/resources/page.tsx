import type { Metadata } from 'next'
import { Resources } from '@/views/marketing/Resources'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Guides for getting QR codes printed, scanned and acted on: placement, wording, a first-100-reviews rollout plan, and responding to critical feedback.',
  alternates: { canonical: '/resources' },
}

export default function Page() {
  return <Resources />
}
