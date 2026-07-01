import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Command, LayoutDashboard, MessageSquareText } from 'lucide-react'
import { useWorkspace } from '@/store/workspace'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to ReviewDot',
    body: 'Your AI review command center. Every review, every platform, one intelligent workspace — with an assistant that drafts, prioritizes, and learns your voice.',
  },
  {
    icon: LayoutDashboard,
    title: 'A dashboard that rearranges itself around you',
    body: 'Drag widgets to reorder them — your layout is remembered. KPIs update live, and AI insights surface what matters before you go looking.',
  },
  {
    icon: MessageSquareText,
    title: 'Reply at the speed of thought',
    body: 'Open any review to see an AI-drafted reply matched to the customer’s tone. Approve, edit, or regenerate — response rates typically double in week one.',
  },
  {
    icon: Command,
    title: 'Everything is one keystroke away',
    body: 'Press ⌘K (or Ctrl+K) anywhere to navigate, act, or ask the AI. Try it as soon as you’re in.',
  },
]

/** First-run walkthrough. Shows once, then persists as completed. */
export function Onboarding() {
  const done = useWorkspace((s) => s.onboardingDone)
  const complete = useWorkspace((s) => s.completeOnboarding)
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
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center shadow-float"
        >
          <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-pulse-500/25 blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="animate-orb relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-pulse-500 to-aura-500 shadow-glow">
                <Icon size={28} className="text-pure" />
              </div>
              <h2 className="font-display mt-6 text-xl font-bold text-mist-50">{current.title}</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-mist-300">{current.body}</p>
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
