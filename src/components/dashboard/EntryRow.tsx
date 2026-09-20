import { Link } from 'react-router-dom'
import { ExternalLink, QrCode } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Stars } from '@/components/ui/Stars'
import { isPositiveTag, outletById, productById } from '@/lib/data'
import { useQRCodes } from '@/store/app'
import type { Entry } from '@/lib/types'
import { relativeTime } from '@/lib/utils'

export function EntryRow({ entry, action }: { entry: Entry; action?: React.ReactNode }) {
  const codes = useQRCodes()
  const product = productById(entry.productId)
  const outlet = outletById(entry.outletId)
  const qr = codes.find((code) => code.id === entry.qrId)

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 transition-shadow duration-300 hover:shadow-soft">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Stars value={entry.rating} />
        <Link
          to={`/app/products/${entry.productId}`}
          className="text-[14px] font-medium text-ink hover:text-accent"
        >
          {product?.emoji} {product?.name}
        </Link>
        <span className="text-[12px] text-faint">·</span>
        <span className="text-[12px] text-muted">{outlet?.name}</span>
        {qr?.location ? <span className="text-[12px] text-muted">· {qr.location}</span> : null}
        <span className="ml-auto text-[12px] text-faint">{relativeTime(entry.createdAt)}</span>
      </div>

      {entry.comment ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{entry.comment}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {entry.tags.map((tag) => (
          <Badge key={tag} tone={isPositiveTag(tag) ? 'positive' : 'warning'}>
            {tag}
          </Badge>
        ))}
        {entry.publicClick ? (
          <Badge tone="info">
            <ExternalLink size={11} /> Continued to {entry.destination === 'instagram' ? 'Instagram' : 'Google'}
          </Badge>
        ) : null}
        {qr ? (
          <Badge>
            <QrCode size={11} /> /r/{qr.code}
          </Badge>
        ) : null}
        {action ? <span className="ml-auto">{action}</span> : null}
      </div>
    </article>
  )
}
