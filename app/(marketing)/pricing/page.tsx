import type { Metadata } from 'next'
import { Pricing } from '@/views/marketing/Pricing'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Priced per outlet, not per review. Free for a single outlet, with Starter, Growth, Business and Enterprise plans as you add outlets and team members.',
  alternates: { canonical: '/pricing' },
}

export default function Page() {
  return <Pricing />
}
