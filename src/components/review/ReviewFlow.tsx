'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Copy, Loader2, Pencil, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip, Textarea } from '@/components/ui/Field'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import { StarPicker } from '@/components/ui/Stars'
import { useCopy } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { ScanContext } from '@/services/scan-context'
import type { Destination } from '@/services/types'
import {
  approveDraft,
  completeSession,
  recordDestinationClick,
  saveDraft,
  submitFeedback,
} from '@/app-actions/feedback'

/**
 * The customer journey: rate → what stood out → their words → AI draft →
 * approve → destination.
 *
 * The draft is assistance, not authorship: it only restates what the customer
 * wrote, they can edit every word, and nothing is submitted anywhere until they
 * choose a destination themselves.
 */

export type FlowStep = 'rate' | 'detail' | 'draft' | 'share' | 'done'

const POSITIVE_CHIPS = ['Food', 'Coffee', 'Service', 'Ambience', 'Staff', 'Cleanliness', 'Value']
const IMPROVE_CHIPS = ['Waiting time', 'Price', 'Quality', 'Packaging', 'Service', 'Cleanliness']

const STEP_ORDER: FlowStep[] = ['rate', 'detail', 'draft', 'share', 'done']

export function ReviewFlow({
  context,
  publicId,
  sessionId = null,
  initialStep = 'rate',
  initialRating = 0,
  compact = false,
}: {
  context: ScanContext
  /**
   * The scanned code. Its presence is what turns persistence on: the landing
   * page renders this same flow as a mockup and passes nothing, so no row is
   * written for a visitor playing with the demo.
   */
  publicId?: string
  sessionId?: string | null
  initialStep?: FlowStep
  initialRating?: number
  compact?: boolean
}) {
  const [step, setStep] = useState<FlowStep>(initialStep)
  const [rating, setRating] = useState(initialRating)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [draft, setDraft] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [chosen, setChosen] = useState<Destination | null>(null)
  const { copied, copy } = useCopy()

  // Ids the journey accumulates. Refs rather than state: nothing renders from
  // them, and a re-render must never lose the link between the steps.
  const feedbackId = useRef<string | null>(null)
  const draftId = useRef<string | null>(null)

  const positive = rating >= 4
  const chips = positive ? POSITIVE_CHIPS : IMPROVE_CHIPS
  const progress = ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100

  const toggleTag = (tag: string) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))

  const requestDraft = async () => {
    setDrafting(true)
    setDraftError(null)
    setStep('draft')

    // The feedback write and the model call overlap: the customer waits for the
    // slower of the two rather than for both in turn. The feedback is what
    // actually matters, so it is started first and never blocks on the draft.
    const feedbackWrite =
      publicId && !feedbackId.current
        ? submitFeedback(publicId, { rating, tags, comment, sessionId }).catch(() => ({
            feedbackId: null,
          }))
        : Promise.resolve({ feedbackId: feedbackId.current })

    let text = comment
    let model: string | null = null

    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          comment,
          rating,
          tags,
          businessName: context.organizationName,
          outletName: context.outletName,
          productName: context.productName,
        }),
      })
      if (!response.ok) throw new Error(`Draft failed (${response.status})`)
      const data = (await response.json()) as { text: string; model?: string }
      text = data.text
      model = data.model ?? null
      setDraft(text)
    } catch {
      // the customer's own words are always a valid review; never block on the model
      setDraft(comment)
      setDraftError('We could not polish that just now, so here are your own words.')
    } finally {
      setDrafting(false)
    }

    const resolved = await feedbackWrite
    feedbackId.current = resolved.feedbackId ?? feedbackId.current

    if (publicId && feedbackId.current) {
      // A rewrite stores a second draft, so the business can see the model was
      // asked twice rather than only what the customer settled on.
      const saved = await saveDraft(publicId, {
        feedbackId: feedbackId.current,
        draftText: text,
        model,
      }).catch(() => ({ draftId: null }))
      draftId.current = saved.draftId ?? draftId.current
    }
  }

  /** The customer accepted the wording, edited or not. */
  const acceptDraft = () => {
    if (publicId && draftId.current) {
      void approveDraft(publicId, { draftId: draftId.current, finalText: draft }).catch(() => {})
    }
    setStep('share')
  }

  const chooseDestination = (destination: Destination) => {
    void copy(draft)
    setChosen(destination)
    setStep('done')
    if (publicId) {
      void recordDestinationClick(publicId, {
        feedbackId: feedbackId.current,
        draftId: draftId.current,
        sessionId,
        kind: destination.kind,
        url: destination.url,
      }).catch(() => {})
    }
    window.open(destination.url, '_blank', 'noopener,noreferrer')
  }

  /** Keeping it private is a complete journey too, and is recorded as one. */
  const keepPrivate = () => {
    setStep('done')
    if (publicId) void completeSession(publicId, sessionId).catch(() => {})
  }

  const heading = compact ? 'text-[17px]' : 'text-xl'

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col bg-surface', compact && 'text-[13px]')}>
      <div className="h-1 w-full bg-raised">
        <motion.div
          className="h-full rounded-r-full bg-accent"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <p className={cn('truncate font-semibold tracking-tight text-ink', compact ? 'text-[15px]' : 'text-lg')}>
            {context.organizationName}
          </p>
          <p className="truncate text-[12px] text-muted">
            {context.outletName}
            {context.placement ? ` · ${context.placement}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          ReviewDot
        </span>
      </header>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-4">
        <AnimatePresence mode="wait">
          {step === 'rate' ? (
            <Panel key="rate">
              {context.productName ? (
                <div className="mx-auto grid w-full max-w-[200px] place-items-center rounded-3xl bg-gradient-to-br from-brand-50 to-raised py-6 text-[44px]">
                  <span aria-hidden>{context.productEmoji ?? '⭐'}</span>
                </div>
              ) : null}
              <h1 className={cn('mt-5 text-center font-semibold tracking-tight text-ink', heading)}>
                How was your experience?
              </h1>
              <p className="mt-1.5 text-center text-[12px] text-muted">
                {context.productName ? `${context.productName} · ` : ''}Takes about twenty seconds.
              </p>
              <div className={compact ? 'mt-4' : 'mt-6'}>
                <StarPicker value={rating} onChange={setRating} size={compact ? 30 : 40} />
              </div>
              <div className="mt-auto pt-6">
                <Button className="w-full" disabled={!rating} onClick={() => setStep('detail')}>
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </Panel>
          ) : null}

          {step === 'detail' ? (
            <Panel key="detail">
              <h1 className={cn('font-semibold tracking-tight text-ink', heading)}>
                {positive ? 'What did you enjoy?' : 'What could be better?'}
              </h1>
              <p className="mt-1.5 text-[12px] text-muted">Tap anything that applies. Optional.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Chip key={chip} selected={tags.includes(chip)} onClick={() => toggleTag(chip)}>
                    {chip}
                  </Chip>
                ))}
              </div>
              <label className="mt-5 block">
                <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                  Tell us about your experience
                </span>
                <Textarea
                  rows={compact ? 3 : 4}
                  placeholder="Tell us what you liked or what we could improve..."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
              <div className="mt-auto pt-6">
                <Button className="w-full" disabled={!comment.trim()} onClick={requestDraft}>
                  <Sparkles size={16} /> Create My Review
                </Button>
                <p className="mt-2.5 text-center text-[11px] text-faint">
                  We turn your words into a review you can edit before anything is shared.
                </p>
              </div>
            </Panel>
          ) : null}

          {step === 'draft' ? (
            <Panel key="draft">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-accent" />
                <h1 className={cn('font-semibold tracking-tight text-ink', heading)}>Your review</h1>
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                Written from what you told us. Edit anything — it is your review.
              </p>

              {drafting ? (
                <div className="mt-5 space-y-2.5 rounded-2xl border border-line bg-raised p-4">
                  <span className="flex items-center gap-2 text-[13px] text-muted">
                    <Loader2 size={14} className="animate-spin" /> Writing your review…
                  </span>
                  <span className="block h-3 w-full animate-pulse rounded-full bg-line" />
                  <span className="block h-3 w-4/5 animate-pulse rounded-full bg-line" />
                  <span className="block h-3 w-3/5 animate-pulse rounded-full bg-line" />
                </div>
              ) : editing ? (
                <Textarea
                  className="mt-5"
                  rows={compact ? 5 : 7}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label="Edit your review"
                />
              ) : (
                <blockquote className="mt-5 rounded-2xl border border-line bg-raised p-4 text-[14px] leading-relaxed text-ink-soft">
                  {draft}
                </blockquote>
              )}

              {draftError ? <p className="mt-2 text-[11px] text-warn">{draftError}</p> : null}

              {!drafting ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing((value) => !value)}>
                    <Pencil size={14} /> {editing ? 'Done editing' : 'Edit review'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={requestDraft}>
                    <RefreshCw size={14} /> Rewrite
                  </Button>
                </div>
              ) : null}

              <div className="mt-auto pt-6">
                <Button className="w-full" disabled={drafting || !draft.trim()} onClick={acceptDraft}>
                  Use This Review <ArrowRight size={16} />
                </Button>
              </div>
            </Panel>
          ) : null}

          {step === 'share' ? (
            <Panel key="share">
              <h1 className={cn('font-semibold tracking-tight text-ink', heading)}>Where would you like to post it?</h1>
              <p className="mt-1.5 text-[12px] text-muted">
                Your review is copied for you. Choose a platform, or keep it private — your feedback already reached
                the team.
              </p>

              <div className="mt-5 space-y-2.5">
                {context.destinations.map((destination) => (
                  <Button
                    key={destination.kind}
                    variant={destination.kind === 'google' ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={() => chooseDestination(destination)}
                  >
                    {destination.kind === 'google' ? <GoogleGlyph size={16} /> : null}
                    Post on {destination.label}
                  </Button>
                ))}
                <Button variant="ghost" className="w-full" onClick={keepPrivate}>
                  Keep it private
                </Button>
              </div>

              <button
                onClick={() => copy(draft)}
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy review text'}
              </button>
            </Panel>
          ) : null}

          {step === 'done' ? (
            <Panel key="done" center>
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Check size={26} />
              </span>
              <h1 className={cn('mt-4 font-semibold tracking-tight text-ink', compact ? 'text-[18px]' : 'text-2xl')}>
                Thank you! ❤️
              </h1>
              <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-muted">
                {chosen
                  ? `Your review is copied — paste it on ${chosen.label} and you're done.`
                  : `Your feedback reached the ${context.outletName} team.`}
              </p>
            </Panel>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Panel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.26 }}
      className={cn('flex min-h-full flex-1 flex-col', center && 'items-center justify-center text-center')}
    >
      {children}
    </motion.div>
  )
}
