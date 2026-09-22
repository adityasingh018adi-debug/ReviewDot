import type { Metadata } from 'next'
import { QRCodes } from '@/views/app/QRCodes'

export const metadata: Metadata = { title: 'QR campaigns' }

export default function Page() {
  return <QRCodes />
}
