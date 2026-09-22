'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { ArrowRight, Send, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'
import { InsightList } from '@/components/dashboard/InsightList'
import { RankedBars } from '@/components/charts/BarChart'
import { businessInsights, feedbackThemes, productSummary } from '@/lib/insights'
import { byOutlet, byProduct, entriesIn, overview } from '@/lib/metrics'
import { business, outletById } from '@/lib/data'
import type { AIContext, ChatMessage } from '@/lib/ai'
import { useDataSet, useScope } from '@/store/app'
import { cn } from '@/lib/utils'

export function Insights() {
  const scope = useScope()
  const data = useDataSet()

  const insights = useMemo(() => businessInsights(scope, data), [scope, data])
  const themes = useMemo(() => feedbackThemes(scope, data, 6), [scope, data])
  const productRows = useMemo(() => byProduct(scope, data), [scope, data])
  const outletRows = useMemo(() => byOutlet(scope, data), [scope, data])
  const stats = useMemo(() => overview(scope, data), [scope, data])
  const entries = useMemo(() => entriesIn(scope, data), [scope, data])

  const [productId, setProductId] = useState(productRows[0]?.id ?? '')
  const summary = useMemo(
    () => (productId ? productSummary(productId, scope, data) : null),
    [productId, scope, data],
  )

  const context: AIContext = useMemo(
    () => ({
      business: business.name,
      range: scope.range.label,
      outlet: scope.outletId === 'all' ? 'All outlets' : (outletById(scope.outletId)?.name ?? 'All outlets'),
      scans: stats.scans,
      reviews: stats.reviews,
      rating: stats.rating,
      conversion: stats.conversion,
      googleClicks: stats.googleClicks,
      topProducts: productRows.map((row) => ({
        name: row.name,
        reviews: row.reviews,
        rating: row.rating,
        positive: row.positive,
      })),
      outlets: outletRows.map((row) => ({
        name: row.name,
        reviews: row.reviews,
        rating: row.rating,
        conversion: row.conversion,
      })),
      themes: themes.map((theme) => ({ tag: theme.tag, count: theme.count })),
      insights,
    }),
    [scope, stats, productRows, outletRows, themes, insights],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description={`Generated from ${entries.length} ratings in ${scope.range.label.toLowerCase()}. Every statement traces back to reviews you collected.`}
        action={<Badge tone="positive">Grounded in your data</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" /> What changed this period
              </span>
            }
            subtitle="Ranked by impact on your rating and review volume"
          />
          <InsightList cards={insights} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Product summary"
              subtitle="Pick any product to read its customer summary"
              action={
                summary ? (
                  <Badge tone={summary.momentum === 'slipping' ? 'danger' : 'positive'}>
                    {summary.momentum === 'slipping' ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    {summary.momentum}
                  </Badge>
                ) : null
              }
            />
            <Select value={productId} onChange={(event) => setProductId(event.target.value)} aria-label="Product">
              {productRows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </Select>

            {summary ? (
              <div className="mt-5 space-y-5">
                <p className="text-[14px] leading-relaxed text-ink-soft">{summary.headline}</p>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Customers frequently mention
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {summary.loved.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13px] text-ink-soft">
                        <span className="size-1.5 rounded-full bg-brand-400" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Areas mentioned for improvement
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {summary.improve.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13px] text-ink-soft">
                        <span className="size-1.5 rounded-full bg-warn" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/app/products/${summary.productId}`}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
                >
                  Open product analytics <ArrowRight size={14} />
                </Link>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Feedback themes" subtitle="Clustered from issue chips and comments" />
            <RankedBars
              data={themes.map((theme) => ({
                label: theme.tag,
                value: theme.count,
                hint: theme.outlets[0] ? `${theme.outlets[0].name} leads` : undefined,
              }))}
              color="var(--color-chart-3)"
              caption="Reported themes"
            />
          </Card>
        </div>
      </div>

      <Assistant context={context} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  'Which product should we promote next week?',
  'What is hurting our rating?',
  'How is scan conversion across outlets?',
  'How many customers continued to Google?',
]

function Assistant({ context }: { context: AIContext }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const ask = async (question: string) => {
    if (!question.trim() || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setDraft('')
    setBusy(true)

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, context, history: messages }),
      })
      if (!response.ok) throw new Error(`Assistant failed (${response.status})`)
      const data = (await response.json()) as { text: string }
      setMessages([...next, { role: 'assistant', content: data.text }])
    } catch (error) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: `The analyst could not be reached (${error instanceof Error ? error.message : 'unknown error'}). Try again in a moment.`,
        },
      ])
    } finally {
      setBusy(false)
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <Card>
      <CardHeader
        title="Ask about your customers"
        subtitle="Grounded in this workspace's numbers — it never invents figures."
      />

      {messages.length ? (
        <div className="thin-scroll mb-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
                message.role === 'user' ? 'ml-auto bg-accent text-on-accent' : 'bg-raised text-ink-soft',
              )}
            >
              {message.content || '…'}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => ask(suggestion)}
              className="rounded-full border border-line px-3.5 py-2 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          ask(draft)
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about products, outlets, conversion…"
          aria-label="Ask the analyst"
        />
        <Button type="submit" disabled={busy || !draft.trim()}>
          <Send size={15} /> Ask
        </Button>
      </form>
    </Card>
  )
}
