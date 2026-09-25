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
import type { Destination, ReviewEventKind } from '@/services/types'
import { wantsCaption } from '@/services/review-destination'
import {
  approveDraft,
  completeSession,
  recordDestinationClick,
  saveDraft,
  submitFeedback,
} from '@/app-actions/feedback'

/**
 * The customer journey, and it forks on the rating.
 *
 *   4–5★   rate → what stood out → AI draft → approve → share
 *   1–3★   rate → what went wrong → thank you.  Nothing else.
 *
 * The fork is the product, not a nicety. Sending an unhappy customer to Google
 * is asking them to publish the complaint they just made in private, and no
 * business wants a one-star review it solicited. Below four stars the draft is
 * never requested, the share step does not exist, and the feedback goes to the
 * team instead — which is the thing that can actually be acted on.
 *
 * Nothing here suppresses a bad review: a customer who wants to post one can,
 * on the platform, as they always could. It is the *prompting* that stops.
 *
 * Be clear-eyed about what that is, though. Routing only happy customers to the
 * review platforms is "review gating", and it is prohibited by Google's own
 * review policies and by the FTC's rule on consumer reviews (16 CFR Part 465),
 * which covers selectively soliciting positive reviews as well as removing
 * negative ones. The threshold is one named constant precisely so that a
 * business can decide otherwise; the previous behaviour — every rating sees
 * every destination — is PUBLIC_THRESHOLD = 1.
 *
 * Above four stars the draft is assistance, not authorship: it restates what
 * the customer wrote, they can edit every word, and nothing is published until
 * they choose a destination themselves.
 */

export type FlowStep = 'rate' | 'detail' | 'draft' | 'share' | 'done'

/** Below this, the journey stays private. */
const PUBLIC_THRESHOLD = 4

const POSITIVE_CHIPS = ['Food', 'Coffee', 'Service', 'Ambience', 'Staff', 'Cleanliness', 'Value']
const IMPROVE_CHIPS = ['Waiting time', 'Price', 'Quality', 'Packaging', 'Service', 'Cleanliness']

const STEP_ORDER: FlowStep[] = ['rate', 'detail', 'draft', 'share', 'done']
const PRIVATE_STEP_ORDER: FlowStep[] = ['rate', 'detail', 'done']

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
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [chosen, setChosen] = useState<Destination | null>(null)
  const [caption, setCaption] = useState('')
  const [captioning, setCaptioning] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const { copied, copy } = useCopy()

  // Ids the journey accumulates. Refs rather than state: nothing renders from
  // them, and a re-render must never lose the link between the steps.
  const feedbackId = useRef<string | null>(null)
  const draftId = useRef<string | null>(null)

  const positive = rating >= PUBLIC_THRESHOLD
  const chips = positive ? POSITIVE_CHIPS : IMPROVE_CHIPS
  // The private branch is two steps shorter, and a progress bar that claims
  // otherwise is telling the customer there is more to do than there is.
  const order = positive ? STEP_ORDER : PRIVATE_STEP_ORDER
  const progress = ((Math.max(order.indexOf(step), 0) + 1) / order.length) * 100

  const toggleTag = (tag: string) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))

  /**
   * 1–3★. The feedback is recorded and the journey ends there.
   *
   * No model call, no draft row, no share step — and the write is awaited
   * rather than fired off, because "thank you" must not appear before the
   * thing being thanked for has actually been saved.
   */
  const sendPrivateFeedback = async () => {
    setSending(true)
    setStep('done')

    if (publicId && !feedbackId.current) {
      const saved = await submitFeedback(publicId, { rating, tags, comment, sessionId }).catch(
        () => ({ feedbackId: null }),
      )
      feedbackId.current = saved.feedbackId ?? null
    }
    if (publicId) await completeSession(publicId, sessionId).catch(() => {})
    setSending(false)
  }

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

  /** What this destination should carry: a caption for Instagram, else the review. */
  const textFor = (destination: Destination) =>
    wantsCaption(destination.kind) && caption.trim() ? caption : draft

  const record = (destination: Destination, event: ReviewEventKind) => {
    if (!publicId) return
    void recordDestinationClick(publicId, {
      feedbackId: feedbackId.current,
      draftId: draftId.current,
      sessionId,
      kind: destination.kind,
      url: destination.url,
      event,
    }).catch(() => {})
  }

  /**
   * Share through the device.
   *
   * Where the browser has the Web Share API the text goes into the phone's own
   * sheet, which is one tap and lands in whichever app the customer picks.
   * Everywhere else, copying and opening the platform is the same job done by
   * hand. A cancelled share sheet is not an error and is not recorded: the
   * customer decided not to, which is a perfectly good answer.
   */
  const shareReview = async (destination: Destination) => {
    const text = textFor(destination)
    setChosen(destination)

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url: destination.url })
        record(destination, 'shared')
        setStep('done')
        return
      } catch {
        // dismissed, or the sheet refused the payload — fall through to copying
      }
    }

    await copy(text)
    record(destination, 'copied')
    openDestination(destination, false)
  }

  /** Copy the text and send them to the platform to paste it. */
  const copyAndOpen = async (destination: Destination) => {
    setChosen(destination)
    await copy(textFor(destination))
    record(destination, 'copied')
    openDestination(destination, false)
  }

  const openDestination = (destination: Destination, alsoRecord = true) => {
    setChosen(destination)
    if (alsoRecord) record(destination, 'opened')
    setStep('done')
    window.open(destination.url, '_blank', 'noopener,noreferrer')
  }

  /** A short version for Instagram, from the same feedback — never a new claim. */
  const requestCaption = async () => {
    setCaptioning(true)
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
          format: 'caption',
        }),
      })
      if (!response.ok) throw new Error(String(response.status))
      const data = (await response.json()) as { text: string }
      setCaption(data.text)
    } catch {
      // the customer's own first line is always a valid caption
      setCaption(comment.split(/(?<=[.!?])\s+/)[0] ?? comment)
    } finally {
      setCaptioning(false)
    }
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
              <p className="mt-1.5 text-[12px] text-muted">
                {positive
                  ? 'Tap anything that applies. Optional.'
                  : 'Tell the team directly — this stays private.'}
              </p>
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
                {positive ? (
                  <>
                    <Button className="w-full" disabled={!comment.trim()} onClick={requestDraft}>
                      <Sparkles size={16} /> Create My Review
                    </Button>
                    <p className="mt-2.5 text-center text-[11px] text-faint">
                      We turn your words into a review you can edit before anything is shared.
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      disabled={!comment.trim() || sending}
                      onClick={sendPrivateFeedback}
                    >
                      {sending ? 'Sending…' : 'Send feedback'} <ArrowRight size={16} />
                    </Button>
                    <p className="mt-2.5 text-center text-[11px] text-faint">
                      This goes straight to the {context.outletName} team. Nothing is posted
                      publicly.
                    </p>
                  </>
                )}
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
                Share it straight from your phone, or copy it and we&rsquo;ll open the platform for
                you. Keeping it private is fine too — your feedback already reached the team.
              </p>

              <div className="mt-5 space-y-3">
                {context.destinations.map((destination) => {
                  const isCaption = wantsCaption(destination.kind)
                  return (
                    <div
                      key={destination.kind}
                      className="rounded-2xl border border-line bg-raised p-3"
                    >
                      <div className="flex items-center gap-2">
                        {destination.kind === 'google' ? <GoogleGlyph size={15} /> : null}
                        <span className="flex-1 text-[13.5px] font-medium text-ink">
                          {destination.label}
                        </span>
                      </div>

                      {isCaption ? (
                        <div className="mt-2.5">
                          {caption ? (
                            editingCaption ? (
                              <Textarea
                                rows={3}
                                value={caption}
                                onChange={(event) => setCaption(event.target.value)}
                                aria-label="Edit your Instagram caption"
                              />
                            ) : (
                              <p className="rounded-xl border border-line bg-surface p-2.5 text-[13px] leading-relaxed text-ink-soft">
                                {caption}
                              </p>
                            )
                          ) : (
                            <p className="text-[12px] leading-relaxed text-muted">
                              A shorter version, for a caption rather than a review.
                            </p>
                          )}

                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {caption ? (
                              <>
                                <Button size="sm" onClick={() => void shareReview(destination)}>
                                  Share
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => void copyAndOpen(destination)}
                                >
                                  <Copy size={13} /> Copy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCaption((value) => !value)}
                                >
                                  <Pencil size={13} /> {editingCaption ? 'Done' : 'Edit'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={requestCaption}>
                                  <RefreshCw size={13} />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                disabled={captioning}
                                onClick={requestCaption}
                              >
                                <Sparkles size={13} />
                                {captioning ? 'Writing…' : 'Generate Instagram caption'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => void shareReview(destination)}
                          >
                            Share
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => void copyAndOpen(destination)}
                          >
                            <Copy size={13} /> Copy &amp; open
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

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
                  : positive
                    ? `Your feedback reached the ${context.outletName} team.`
                    : `Thank you for telling us. The ${context.outletName} team will see this, and nothing has been posted publicly.`}
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
