'use client'

import { useMemo, useState } from 'react'
import { Check, Clock, Download, MessageSquareWarning } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'
import { PageHeader } from '@/components/layout/PageHeader'
import { EntryRow } from '@/components/dashboard/EntryRow'
import { RankedBars } from '@/components/charts/BarChart'
import { feedbackThemes } from '@/lib/insights'
import { entriesIn } from '@/lib/metrics'
import { outletById, productById } from '@/lib/data'
import { useApp, useDataSet, useScope } from '@/store/app'
import { downloadCSV } from '@/lib/export'
import type { FeedbackStatus } from '@/lib/types'
import { cn, formatNumber } from '@/lib/utils'

const TABS: { key: FeedbackStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'new', label: 'New' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
]

export function Feedback() {
  const scope = useScope()
  const data = useDataSet()
  const patchEntry = useApp((s) => s.patchEntry)
  const [tab, setTab] = useState<FeedbackStatus | 'all'>('all')

  const all = useMemo(() => entriesIn(scope, data).filter((entry) => entry.kind === 'feedback'), [scope, data])
  const themes = useMemo(() => feedbackThemes(scope, data, 6), [scope, data])
  const filtered = useMemo(() => (tab === 'all' ? all : all.filter((entry) => entry.status === tab)), [all, tab])

  const counts = {
    new: all.filter((entry) => entry.status === 'new').length,
    'in-progress': all.filter((entry) => entry.status === 'in-progress').length,
    resolved: all.filter((entry) => entry.status === 'resolved').length,
  }

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Private ratings of 3★ and below. These never reach a public platform — they reach your team."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCSV(
                all.map((entry) => ({
                  date: entry.createdAt,
                  rating: entry.rating,
                  status: entry.status,
                  product: productById(entry.productId)?.name ?? '',
                  outlet: outletById(entry.outletId)?.name ?? '',
                  issues: entry.tags.join(' | '),
                  comment: entry.comment,
                })),
                'reviewdot-feedback.csv',
              )
            }
          >
            <Download size={15} /> Export CSV
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'New', value: counts.new, tone: 'danger' as const, icon: MessageSquareWarning },
          { label: 'In progress', value: counts['in-progress'], tone: 'warning' as const, icon: Clock },
          { label: 'Resolved', value: counts.resolved, tone: 'positive' as const, icon: Check },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-2xl bg-raised text-muted">
              <item.icon size={17} />
            </span>
            <div>
              <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-ink">
                {formatNumber(item.value)}
              </p>
              <p className="mt-1 text-[12px] text-muted">{item.label}</p>
            </div>
            <Badge tone={item.tone} className="ml-auto">
              {all.length ? Math.round((item.value / all.length) * 100) : 0}%
            </Badge>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-colors',
                  tab === item.key
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-surface text-muted hover:text-ink',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filtered.length ? (
            <div className="space-y-3">
              {filtered.slice(0, 20).map((entry) => (
                <div key={entry.id}>
                  <EntryRow
                    entry={entry}
                    action={
                      <span className="flex items-center gap-2">
                        <Badge
                          tone={
                            entry.status === 'resolved'
                              ? 'positive'
                              : entry.status === 'in-progress'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {entry.status === 'in-progress' ? 'In progress' : entry.status}
                        </Badge>
                        {entry.status !== 'resolved' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              patchEntry(entry.id, {
                                status: entry.status === 'new' ? 'in-progress' : 'resolved',
                              })
                            }
                          >
                            {entry.status === 'new' ? 'Take it on' : 'Mark resolved'}
                          </Button>
                        ) : null}
                      </span>
                    }
                  />
                  {entry.reply ? (
                    <p className="ml-4 mt-2 border-l-2 border-line pl-4 text-[13px] leading-relaxed text-muted">
                      <span className="font-medium text-ink">Team response · </span>
                      {entry.reply}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Nothing here" detail="No feedback in this status for the selected period." />
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader title="What customers report" subtitle="Issue chips across this period" />
          <RankedBars
            data={themes.map((theme) => ({
              label: theme.tag,
              value: theme.count,
              hint: theme.outlets[0] ? `mostly ${theme.outlets[0].name}` : undefined,
            }))}
            color="var(--color-chart-3)"
            caption="Most reported issues"
          />
          {themes[0]?.sample ? (
            <blockquote className="mt-5 rounded-2xl bg-raised p-4 text-[13px] leading-relaxed text-ink-soft">
              "{themes[0].sample}"
            </blockquote>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
