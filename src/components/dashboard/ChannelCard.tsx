import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { BarSpark } from '@/components/ui/Sparkline'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import type { ChannelKey, ChannelRow } from '@/services/dashboard'
import { formatNumber } from '@/lib/utils'

/**
 * One review channel.
 *
 * The figure is click-throughs — customers this business sent to that platform.
 * It is not that platform's review count, and the card never implies otherwise:
 * no platform reports back whether a review was actually posted, so a number
 * presented as "2,846 reviews on Google" would be one we made up about somebody
 * else's business.
 *
 * A channel nobody has set up says so and offers the way to set it up, rather
 * than showing a zero that reads like failure.
 */

const CHANNEL_META: Record<ChannelKey, { name: string; color: string; mark: 'google' | 'instagram' | string }> = {
  google: { name: 'Google', color: 'var(--color-channel-google)', mark: 'google' },
  zomato: { name: 'Zomato', color: 'var(--color-channel-zomato)', mark: 'Z' },
  swiggy: { name: 'Swiggy', color: 'var(--color-channel-swiggy)', mark: 'S' },
  instagram: { name: 'Instagram', color: 'var(--color-channel-instagram)', mark: 'instagram' },
}

export function ChannelCard({ row, series }: { row: ChannelRow; series?: number[] }) {
  const meta = CHANNEL_META[row.channel]

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-2.5">
        <ChannelMark channel={row.channel} />
        <p className="flex-1 truncate text-[14px] font-semibold text-ink">{meta.name}</p>
        {row.configured ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Connected
          </span>
        ) : (
          <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-muted">
            Not set up
          </span>
        )}
      </div>

      {row.configured ? (
        <>
          <p className="mt-3 font-display text-[22px] font-bold leading-none tracking-tight text-ink">
            {formatNumber(row.clicks)}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            customers sent here
            <span className="block text-[11px] text-faint">
              {meta.name} does not report back which of them posted
            </span>
          </p>
          {series && series.length > 1 ? (
            <BarSpark values={series} color={meta.color} className="mt-3" />
          ) : null}
          <div className="mt-3 flex gap-2">
            <Link
              href="/app/analytics"
              className="flex-1 rounded-xl bg-raised px-3 py-2 text-center text-[12px] font-medium text-ink-soft transition-colors hover:bg-line"
            >
              View analytics
            </Link>
            <Link
              href="/app/outlets"
              className="flex-1 rounded-xl px-3 py-2 text-center text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: meta.color }}
            >
              Manage
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            No outlet sends customers to {meta.name} yet.
          </p>
          {row.clicks > 0 ? (
            <p className="mt-1 text-[12px] text-faint">
              {formatNumber(row.clicks)} went there before it was removed.
            </p>
          ) : null}
          <Link
            href="/app/outlets"
            className="mt-4 block rounded-xl border border-line px-3 py-2 text-center text-[12px] font-medium text-ink transition-colors hover:bg-raised"
          >
            Set up {meta.name}
          </Link>
        </>
      )}
    </div>
  )
}

function ChannelMark({ channel }: { channel: ChannelKey }) {
  const meta = CHANNEL_META[channel]

  if (channel === 'google') {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface">
        <GoogleGlyph size={17} />
      </span>
    )
  }

  if (channel === 'instagram') {
    return (
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
        style={{ background: 'linear-gradient(135deg,#f9ce34,#ee2a7b 45%,#6228d7)' }}
      >
        <Instagram size={17} strokeWidth={2.2} />
      </span>
    )
  }

  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-xl text-[14px] font-bold text-white"
      style={{ backgroundColor: meta.color }}
    >
      {meta.mark}
    </span>
  )
}
