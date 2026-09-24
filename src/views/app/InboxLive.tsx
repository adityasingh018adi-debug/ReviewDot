'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink, Pencil } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'
import { Stars } from '@/components/ui/Stars'
import type { Page, ReviewItem } from '@/services/dashboard'
import { OutletPicker } from '@/components/layout/ScopePickers'

/**
 * Reviews that actually reached a platform.
 *
 * The distinction from the feedback page is not cosmetic: a review is feedback
 * whose draft the customer approved and then clicked through to post. The
 * platform never learns whether they finished posting — nothing here claims it
 * did, which is why the label is "sent to Google", not "posted".
 */
export function InboxLive({
  rangeLabel,
  outletLabel,
  page,
  baseQuery,
}: {
  rangeLabel: string
  outletLabel: string
  page: Page<ReviewItem>
  baseQuery: Record<string, string>
}) {
  const nextLink = (cursor: string) => {
    const params = new URLSearchParams({ ...baseQuery, cursor })
    return `/app/inbox?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={`${rangeLabel} · ${outletLabel}`}
        action={<OutletPicker />}
      />

      <Card>
        <CardHeader
          title="Reviews your customers sent to a platform"
          subtitle="The words they chose, and where they took them"
        />

        {page.items.length ? (
          <div className="space-y-3">
            {page.items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={item.rating} size={14} />
                  {item.outletName ? <span className="text-[12px] text-muted">{item.outletName}</span> : null}
                  {item.productName ? <span className="text-[12px] text-faint">· {item.productName}</span> : null}
                  {item.destination ? (
                    <Badge tone="positive">
                      <ExternalLink size={11} /> sent to {item.destination}
                    </Badge>
                  ) : null}
                  {item.editedByCustomer ? (
                    <Badge tone="neutral">
                      <Pencil size={11} /> edited
                    </Badge>
                  ) : null}
                  <span className="ml-auto text-[11px] text-faint">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                {item.finalText ? (
                  <blockquote className="mt-3 rounded-xl bg-raised p-3 text-[13px] leading-relaxed text-ink-soft">
                    {item.finalText}
                  </blockquote>
                ) : null}

                {item.comment && item.comment !== item.finalText ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[12px] text-muted hover:text-ink">
                      What they originally wrote
                    </summary>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-faint">{item.comment}</p>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No reviews yet in this period"
            detail="A review lands here once a customer approves their draft and chooses somewhere to post it."
          />
        )}

        {page.nextCursor ? (
          <div className="mt-5 flex justify-center">
            <Link
              href={nextLink(page.nextCursor)}
              className="inline-flex h-11 items-center gap-1.5 rounded-2xl border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-raised"
            >
              Load more <ArrowRight size={15} />
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
