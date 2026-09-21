import { Instagram } from 'lucide-react'
import { QRPreview } from './QRPreview'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import { cn } from '@/lib/utils'
import { displayUrl, scanUrl } from '@/lib/links'

/**
 * The physical artefact: the card that sits on a café table. Used on the
 * landing hero, in the QR studio preview and on the printable sheet.
 */
export function TableCard({
  code,
  headline = 'Loved your experience?',
  caption = 'Scan. Rate. Review. Grow.',
  note = 'Your feedback helps us grow ❤️',
  className,
  size = 'md',
  linkLabel,
}: {
  code: string
  headline?: string
  caption?: string
  note?: string
  className?: string
  size?: 'sm' | 'md'
  /** Overrides the printed short link — used by the builder preview. */
  linkLabel?: string
}) {
  const compact = size === 'sm'
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-line bg-surface text-center shadow-card',
        compact ? 'gap-2 px-5 py-6' : 'gap-3 px-8 py-9',
        className,
      )}
    >
      <p className="font-display text-[15px] font-semibold tracking-tight text-ink">ReviewDot</p>
      <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] text-accent sm:text-[11px]">
        {caption}
      </p>
      <p className={cn('mt-2 font-semibold tracking-tight text-ink', compact ? 'text-base' : 'text-xl')}>
        {headline}
      </p>
      <div className={cn('mt-3 rounded-2xl border border-line p-3', compact ? 'p-2.5' : 'p-3.5')}>
        <QRPreview value={scanUrl(code)} size={compact ? 92 : 132} />
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-soft">Scan to review</p>
      <div className="mt-1 flex items-center gap-3 text-muted">
        <GoogleGlyph size={16} />
        <Instagram size={15} />
      </div>
      <p className="mt-2 font-hand text-[17px] leading-tight text-accent">{note}</p>
      <p className="mt-1 text-[10px] tracking-wide text-faint">{linkLabel ?? displayUrl(code)}</p>
    </div>
  )
}
