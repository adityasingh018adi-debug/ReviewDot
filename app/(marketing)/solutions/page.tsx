import type { Metadata } from 'next'
import { Solutions } from '@/views/marketing/Solutions'

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'ReviewDot for restaurants, cafés, hotels, salons, retail, gyms, clinics, bakeries, QSR and cloud kitchens — wherever the experience happens.',
  alternates: { canonical: '/solutions' },
}

export default function Page() {
  return <Solutions />
}
