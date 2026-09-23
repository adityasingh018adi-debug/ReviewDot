import type { Metadata } from 'next'
import { QRCodes } from '@/views/app/QRCodes'
import { SeededNotice } from '@/components/layout/SeededNotice'

export const metadata: Metadata = { title: 'QR campaigns' }

export default function Page() {
  return (
    <div className="space-y-4">
      <SeededNotice />
      <QRCodes />
    </div>
  )
}
