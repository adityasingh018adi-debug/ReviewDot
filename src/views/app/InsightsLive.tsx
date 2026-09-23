'use client'

import { useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Empty } from '@/components/ui/Empty'
import { InsightList } from '@/components/dashboard/InsightList'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/ai'
import type { InsightCard } from '@/lib/insights'

/**
 * Insights and the analyst.
 *
 * The cards are computed, not generated: each one states a figure that came out
 * of the database. A model writing findings about a business's own customers
 * would be inventing them, which is the one thing this product must not do.
 *
 * The analyst answers questions *about* those figures. It is told never to
 * invent numbers, and — since this page — the numbers it sees are assembled on
 * the server from the caller's own rows. The browser sends a question and the
 * current filters, and nothing it sends reaches the system prompt.
 */

const SUGGESTIONS = [
  'Which outlet needs attention first?',
  'What are customers complaining about most?',
  'Where am I losing people between scanning and posting?',
]

export function InsightsLive({
  cards,
  rangeLabel,
  outletLabel,
  scope,
}: {
  cards: InsightCard[]
  rangeLabel: string
  outletLabel: string
  /** Passed back to the analyst so it summarises the same window the page shows. */
  scope: Record<string, string>
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="AI insights" description={`${rangeLabel} · ${outletLabel}`} />

      <Card>
        <CardHeader
          title="What your data says"
          subtitle="Every card states a figure from your own feedback — nothing here is generated"
        />
        {cards.length ? (
          <InsightList cards={cards} />
        ) : (
          <Empty
            title="Not enough feedback yet"
            detail="Insights appear once there is enough activity for a difference to mean something rather than be noise."
          />
        )}
      </Card>

      <Assistant scope={scope} />
    </div>
  )
}

function Assistant({ scope }: { scope: Record<string, string> }) {
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
        // question, filters, conversation. The workspace numbers are the
        // server's to assemble, not ours to assert.
        body: JSON.stringify({ question, scope, history: messages }),
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
        <div className="thin-scroll max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                message.role === 'user'
                  ? 'ml-auto bg-accent text-on-accent'
                  : 'bg-raised text-ink-soft',
              )}
            >
              {message.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => ask(suggestion)}
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:border-line-strong hover:bg-raised"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void ask(draft)
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about your outlets, products or feedback…"
          aria-label="Ask the analyst"
        />
        <Button type="submit" disabled={busy || !draft.trim()}>
          {busy ? <Sparkles size={16} className="animate-pulse" /> : <Send size={16} />}
        </Button>
      </form>
    </Card>
  )
}
