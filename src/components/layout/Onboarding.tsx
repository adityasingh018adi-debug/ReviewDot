import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HeartPulse, MessageSquareText } from 'lucide-react'
import { useWorkspace } from '@/store/workspace'
import { useBusiness, BUSINESS_TYPES } from '@/lib/business'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to ReviewDot',
    body: 'Monitor Reviews. Understand Customers. Grow Your Business with AI. Every review from Google, Facebook, TripAdvisor, and Trustpilot — turned into decisions you can act on.',
  },
  {
    icon: HeartPulse,
    title: 'What kind of business do you run?',
    body: 'The AI tunes its insights, complaint analysis, and reply tone to your industry — a clinic gets different advice than a restaurant.',
    picker: true,
  },
  {
    icon: MessageSquareText,
    title: 'Reply in seconds, not hours',
    body: 'Open any review to get an AI summary and a suggested reply matched to the customer’s tone. Approve, edit, or regenerate — and track every review from Open to Closed.',
  },
] as const

/** First-run walkthrough with business-type selection. Shows once, then persists. */
export function Onboarding() {
  const done = useWorkspace((s) => s.onboardingDone)
  const complete = useWorkspace((s) => s.completeOnboarding)
  const type = useBusiness((s) => s.type)
  const setType = useBusiness((s) => s.setType)
  const [step, setStep] = useState(0)

  if (done) return null
  const current = steps[step]
  const Icon = current.icon
  const last = step === steps.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center shadow-float"
        >
          <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-pulse-500/25 blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-pulse-500 to-aura-500 shadow-glow">
                <Icon size={28} className="text-pure" />
              </div>
              <h2 className="font-display mt-6 text-xl font-bold text-mist-50">{current.title}</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-mist-300">{current.body}</p>

              {'picker' in current && current.picker && (
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BUSINESS_TYPES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setType(b.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200',
                        type === b.id
                          ? 'border-pulse-400/50 bg-pulse-500/12 shadow-glow-sm'
                          : 'border-edge bg-white/3 hover:border-white/20',
                      )}
                    >
                      <span className="text-xl">{b.emoji}</span>
                      <span className="text-[11px] font-semibold text-mist-100">{b.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step ? 'w-7 bg-pulse-400' : 'w-1.5 bg-white/15 hover:bg-white/30',
                )}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={complete}>
              Skip tour
            </Button>
            <Button variant="primary" size="md" onClick={() => (last ? complete() : setStep(step + 1))}>
              {last ? 'Enter workspace' : 'Continue'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
