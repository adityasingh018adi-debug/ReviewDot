import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, QrCode } from 'lucide-react'
import { ReviewExperience } from '@/components/review/ReviewExperience'
import { ButtonLink } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'
import { demoQR, outletById, productById, products } from '@/lib/data'
import { useApp, useQRCode } from '@/store/app'

/**
 * The public scan destination: reviewdot.in/r/:code. Paused and archived codes
 * stop collecting, which is how a printed code is retired without reprinting.
 */
export function ScanPage() {
  const { code = '' } = useParams()
  const resolved = useQRCode(code === 'demo' ? demoQR.code : code)
  const recordScan = useApp((s) => s.recordScan)

  useEffect(() => {
    if (resolved && resolved.status === 'active') recordScan(resolved.id, resolved.outletId, resolved.productId)
  }, [resolved, recordScan])

  if (!resolved) {
    return (
      <Fallback
        title="This code isn't active"
        detail="The QR code you scanned doesn't exist in this workspace. Ask the outlet team for an up-to-date code."
      />
    )
  }

  if (resolved.status !== 'active') {
    return (
      <Fallback
        title={resolved.status === 'paused' ? 'This code is paused' : 'This code has been retired'}
        detail="The business has temporarily stopped collecting feedback here. Nothing you scanned was recorded."
      />
    )
  }

  const outlet = outletById(resolved.outletId) ?? outletById(demoQR.outletId)!
  const product = (resolved.productId ? productById(resolved.productId) : undefined) ?? products[0]

  return (
    <div className="flex h-[100dvh] flex-col bg-raised">
      <div className="mx-auto flex w-full min-h-0 max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-muted hover:text-ink">
            <ArrowLeft size={15} /> reviewdot.in
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
            <QrCode size={12} /> /r/{resolved.code}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-line bg-surface shadow-card">
          <ReviewExperience qr={resolved} product={product} outlet={outlet} persist />
        </div>
      </div>
    </div>
  )
}

function Fallback({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="max-w-sm text-center">
        <LogoMark size={44} className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{detail}</p>
        <ButtonLink to="/" variant="secondary" className="mt-6">
          Go to ReviewDot
        </ButtonLink>
      </div>
    </div>
  )
}
