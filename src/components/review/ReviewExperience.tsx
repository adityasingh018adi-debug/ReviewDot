'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Heart, Instagram, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip, Textarea } from '@/components/ui/Field'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import { StarPicker } from '@/components/ui/Stars'
import { ISSUE_TAGS, POSITIVE_TAGS, SERVICE_TAGS, business } from '@/lib/data'
import { useApp } from '@/store/app'
import type { Entry, Outlet, Product, QRCodeRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

export type Step = 'rate' | 'detail' | 'thanks' | 'improve' | 'sent'

const POSITIVE_CHIPS = [...POSITIVE_TAGS, ...SERVICE_TAGS]

const STEP_INDEX: Record<Step, number> = { rate: 0, detail: 1, thanks: 2, improve: 2, sent: 3 }

/**
 * The customer-facing journey: rate → feedback → (public review | private fix).
 * Used live at /r/:code and inside the landing page phone mockups.
 */
export function ReviewExperience({
  qr,
  product,
  outlet,
  initialStep = 'rate',
  initialRating = 0,
  persist = false,
  compact = false,
}: {
  qr: QRCodeRecord
  product: Product
  outlet: Outlet
  initialStep?: Step
  initialRating?: number
  persist?: boolean
  compact?: boolean
}) {
  const submitEntry = useApp((s) => s.submitEntry)
  const [step, setStep] = useState<Step>(initialStep)
  const [rating, setRating] = useState(initialRating)
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')

  const positive = rating >= 4
  // the marketing mockups render inside a phone frame, so the chip list is trimmed
  const allChips: readonly string[] = positive ? POSITIVE_CHIPS : ISSUE_TAGS
  const chips = compact ? allChips.slice(0, 5) : allChips
  const destinationLabel = qr.destination === 'instagram' ? 'Instagram' : 'Google'

  const toggleTag = (tag: string) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))

  const record = (finalTags: string[], comment: string) => {
    if (!persist) return
    const entry: Entry = {
      id: `ent-live-${Date.now()}`,
      kind: rating >= 4 ? 'review' : 'feedback',
      businessId: business.id,
      outletId: outlet.id,
      productId: product.id,
      qrId: qr.id,
      rating,
      tags: finalTags,
      comment,
      createdAt: new Date().toISOString(),
      publicClick: false,
      status: rating >= 4 ? 'resolved' : 'new',
    }
    submitEntry(entry)
  }

  const progress = useMemo(() => (STEP_INDEX[step] / 3) * 100, [step])

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col bg-surface', compact ? 'text-[13px]' : '')}>
      <div className="h-1 w-full bg-raised">
        <motion.div
          className="h-full rounded-r-full bg-accent"
          animate={{ width: `${Math.max(12, progress)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <div>
          <p className={cn('font-semibold tracking-tight text-ink', compact ? 'text-[15px]' : 'text-lg')}>
            {business.name}
          </p>
          <p className="text-[12px] text-muted">
            {outlet.name}
            {qr.location ? ` · ${qr.location}` : ''}
          </p>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          ReviewDot
        </span>
      </div>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-4">
        <AnimatePresence mode="wait">
          {step === 'rate' ? (
            <motion.div
              key="rate"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
              className="flex min-h-full flex-1 flex-col"
            >
              <div
                className={cn(
                  'mx-auto grid w-full place-items-center rounded-3xl bg-gradient-to-br from-brand-50 to-raised',
                  compact ? 'aspect-[16/9] max-w-[190px] text-[42px]' : 'aspect-[4/3] max-w-[220px] text-[56px]',
                )}
              >
                <span aria-hidden>{product.emoji}</span>
              </div>
              <h1 className={cn('mt-5 text-center font-semibold tracking-tight text-ink', compact ? 'text-[17px]' : 'text-xl')}>
                How was your {product.name}?
              </h1>
              <p className="mt-1.5 text-center text-[12px] text-muted">Tap a star — it takes 10 seconds.</p>
              <div className={compact ? 'mt-4' : 'mt-6'}>
                <StarPicker value={rating} onChange={setRating} size={compact ? 30 : 40} />
              </div>
              <div className="mt-auto pt-6">
                <Button
                  className="w-full"
                  disabled={!rating}
                  onClick={() => setStep(rating >= 4 ? 'detail' : 'improve')}
                >
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 'detail' ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
              className="flex min-h-full flex-1 flex-col"
            >
              <h1 className={cn('font-semibold tracking-tight text-ink', compact ? 'text-[17px]' : 'text-xl')}>
                What did you love?
              </h1>
              <p className="mt-1.5 text-[12px] text-muted">Pick anything that stood out. Optional.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Chip key={chip} selected={tags.includes(chip)} onClick={() => toggleTag(chip)}>
                    {chip}
                  </Chip>
                ))}
              </div>
              <Textarea
                className="mt-4"
                rows={compact ? 2 : 3}
                placeholder="Tell us more..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <div className="mt-auto pt-6">
                <Button
                  className="w-full"
                  onClick={() => {
                    record(tags, note)
                    setStep('thanks')
                  }}
                >
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 'thanks' ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-full flex-1 flex-col"
            >
              <div className="mt-2 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <Heart size={24} className="fill-current" />
                </span>
                <h1 className={cn('mt-4 font-semibold tracking-tight text-ink', compact ? 'text-[18px]' : 'text-2xl')}>
                  Thank you! ❤️
                </h1>
                <p className="mt-1.5 text-[13px] text-muted">We're glad you loved it!</p>
              </div>

              <div className="mt-7">
                <p className="text-center text-[13px] font-medium text-ink">Share your experience with others</p>
                <div className="mt-3 space-y-2.5">
                  <Button className="w-full" onClick={() => setStep('sent')}>
                    <GoogleGlyph size={16} /> Review on {destinationLabel}
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => setStep('sent')}>
                    <Instagram size={16} /> Share on Instagram
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep('sent')}>
                    Maybe later
                  </Button>
                </div>
                <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-faint">
                  <Lock size={13} className="mt-0.5 shrink-0" />
                  {compact
                    ? 'Sharing is your choice — we never post for you.'
                    : 'Sharing is entirely your choice. We never post on your behalf, and your rating reaches the team either way.'}
                </p>
              </div>
            </motion.div>
          ) : null}

          {step === 'improve' ? (
            <motion.div
              key="improve"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
              className="flex min-h-full flex-1 flex-col"
            >
              <h1 className={cn('font-semibold tracking-tight text-ink', compact ? 'text-[17px]' : 'text-xl')}>
                We're sorry to hear that.
              </h1>
              <p className="mt-1.5 text-[13px] text-muted">
                {compact
                  ? `This goes straight to the ${outlet.name} team.`
                  : `Your feedback goes straight to the ${outlet.name} team — and to the owner.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Chip key={chip} selected={tags.includes(chip)} onClick={() => toggleTag(chip)}>
                    {chip}
                  </Chip>
                ))}
              </div>
              <Textarea
                className="mt-4"
                rows={compact ? 2 : 4}
                placeholder="Tell us what went wrong..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <div className="mt-auto pt-6">
                <Button
                  className="w-full"
                  onClick={() => {
                    record(tags, note)
                    setStep('sent')
                  }}
                >
                  Submit
                </Button>
                {compact ? null : (
                  <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-faint">
                    <ShieldCheck size={13} className="mt-0.5 shrink-0" />
                    You can still leave a public review if you want to — this form never blocks it.
                  </p>
                )}
              </div>
            </motion.div>
          ) : null}

          {step === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-full flex-1 flex-col items-center justify-center text-center"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Check size={26} />
              </span>
              <h1 className={cn('mt-4 font-semibold tracking-tight text-ink', compact ? 'text-[18px]' : 'text-2xl')}>
                {positive ? 'Thanks for sharing!' : 'Your feedback has been sent to our team.'}
              </h1>
              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-muted">
                {positive
                  ? `We've noted what you loved about the ${product.name}.`
                  : `The ${outlet.name} manager sees this within minutes and will act on it.`}
              </p>
              <Button
                variant="ghost"
                className="mt-6"
                onClick={() => {
                  setStep('rate')
                  setRating(0)
                  setTags([])
                  setNote('')
                }}
              >
                Rate something else
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
