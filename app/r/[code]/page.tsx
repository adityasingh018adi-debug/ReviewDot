import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, QrCode } from 'lucide-react'
import { ReviewFlow } from '@/components/review/ReviewFlow'
import { LogoMark } from '@/components/ui/Logo'
import { resolveScan } from '@/services/scan-context'
import { recordScan } from '@/app-actions/feedback'

/**
 * The scan destination. Server-rendered so the first paint is immediate on a
 * phone, and so the campaign is resolved before any JavaScript runs — the
 * customer never picks an outlet.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Share your experience',
  robots: { index: false, follow: false },
}

export default async function ScanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const lookup = await resolveScan(code)

  if (lookup.status !== 'ok') {
    const copy = {
      'not-found': {
        title: "This code isn't active",
        detail: 'The code you scanned does not exist. Ask the team for an up-to-date one.',
      },
      paused: {
        title: 'This code is paused',
        detail: 'The business has paused feedback here for now. Nothing you scanned was recorded.',
      },
      archived: {
        title: 'This code has been retired',
        detail: 'This QR code is no longer in use.',
      },
    }[lookup.status]

    return (
      <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6">
        <div className="max-w-sm text-center">
          <LogoMark size={44} className="mx-auto" />
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">{copy.title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{copy.detail}</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-2xl border border-line bg-surface px-5 text-sm font-medium text-ink"
          >
            Go to ReviewDot
          </Link>
        </div>
      </div>
    )
  }

  const { context } = lookup

  // Opens the journey: one qr_scans row and one customer_sessions row, so the
  // feedback, draft and destination click that follow can be tied together.
  const { sessionId } = await recordScan(code)

  return (
    <div className="flex h-[100dvh] flex-col bg-raised">
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-medium text-muted hover:text-ink">
            <ArrowLeft size={15} /> reviewdot.in
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
            <QrCode size={12} /> {context.referenceCode}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-line bg-surface shadow-card">
          <ReviewFlow context={context} publicId={code} sessionId={sessionId} />
        </div>
      </div>
    </div>
  )
}
