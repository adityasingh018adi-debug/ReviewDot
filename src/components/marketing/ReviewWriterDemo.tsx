'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { LocalAIReviewService } from '@/services/ai-review'

/**
 * Live demo of the review writer on the marketing site. It calls the same API
 * route the customer flow uses, so what a visitor sees here is what their
 * customers will get — including the rule that nothing is invented.
 */

const EXAMPLE = 'Coffee was really good and sandwich was fresh. Staff was friendly.'

export function ReviewWriterDemo() {
  const [input, setInput] = useState(EXAMPLE)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          comment: input,
          rating: 5,
          tags: [],
          businessName: 'Love & Latte',
          outletName: 'Thane',
        }),
      })
      if (!response.ok) throw new Error('demo unavailable')
      const data = (await response.json()) as { text: string }
      setDraft(data.text)
    } catch {
      const local = await new LocalAIReviewService().draftReview({
        comment: input,
        rating: 5,
        tags: [],
        businessName: 'Love & Latte',
        outletName: 'Thane',
      })
      setDraft(local.text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">What the customer types</p>
        <Textarea
          className="mt-3"
          rows={4}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Customer feedback"
        />
        <Button className="mt-4 w-full" onClick={run} disabled={busy || !input.trim()}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? 'Writing…' : 'Create the review'}
        </Button>
      </Card>

      <Card className="lg:sticky lg:top-24">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">The draft they can edit</p>
        {draft ? (
          <motion.blockquote
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-2xl bg-raised p-4 text-[14px] leading-relaxed text-ink-soft"
          >
            {draft}
          </motion.blockquote>
        ) : (
          <p className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-line p-4 text-[13px] text-muted">
            Run it to see the draft <ArrowRight size={14} />
          </p>
        )}
        <p className="mt-4 text-[12px] leading-relaxed text-faint">
          The writer may only restate what the customer wrote. Prices, wait times, dishes and ratings they never
          mentioned are rejected before the draft is shown.
        </p>
      </Card>
    </div>
  )
}
