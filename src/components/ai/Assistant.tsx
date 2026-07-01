import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, Mic, Square } from 'lucide-react'
import { useWorkspace, useToasts } from '@/store/workspace'
import { assistantSuggestions } from '@/lib/data'
import { streamAssistantReply, aiIsLive, type ChatTurn } from '@/lib/ai'
import { useHotkey } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/** Floating AI orb — breathing glow, pulse rings, opens the command center. */
export function AssistantOrb() {
  const open = useWorkspace((s) => s.assistantOpen)
  const setOpen = useWorkspace((s) => s.setAssistantOpen)

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.9 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setOpen(!open)}
      aria-label="Open AI assistant"
      className="fixed right-6 bottom-24 z-50 grid h-14 w-14 place-items-center rounded-full md:bottom-8"
    >
      <span className="animate-orb absolute inset-0 rounded-full bg-gradient-to-br from-pulse-500 via-aura-500 to-cyan-glow shadow-glow" />
      <span className="absolute inset-0 rounded-full [animation:pulse-ring_2.6s_ease-out_infinite] bg-pulse-500/50" />
      <span
        className="absolute inset-0 rounded-full [animation:pulse-ring_2.6s_ease-out_infinite] bg-aura-500/40"
        style={{ animationDelay: '1.3s' }}
      />
      <motion.span animate={{ rotate: open ? 90 : 0 }} className="relative z-10 text-pure">
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </motion.span>
    </motion.button>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-pulse-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
      <span className="ml-1 text-xs text-mist-400">Aria is thinking…</span>
    </div>
  )
}

/** Slide-in AI command center with streaming chat (Claude API when configured). */
export function AssistantPanel() {
  const open = useWorkspace((s) => s.assistantOpen)
  const setOpen = useWorkspace((s) => s.setAssistantOpen)
  const pushToast = useToasts((s) => s.push)

  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'streaming'>('idle')
  const [streamText, setStreamText] = useState('')
  const [listening, setListening] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useHotkey('escape', () => setOpen(false), open)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, phase, streamText])

  const ask = async (prompt: string) => {
    if (!prompt.trim() || phase !== 'idle') return
    const history: ChatTurn[] = [...messages, { role: 'user', content: prompt }]
    setMessages(history)
    setInput('')
    setPhase('thinking')
    setStreamText('')

    try {
      const full = await streamAssistantReply(history, {
        onThinking: () => setPhase('thinking'),
        onText: (delta) => {
          setPhase('streaming')
          setStreamText((t) => t + delta)
        },
      })
      setMessages((m) => [...m, { role: 'assistant', content: full }])
    } catch (err) {
      pushToast({
        tone: 'error',
        title: 'Aria hit a snag',
        body: err instanceof Error ? err.message : 'Request failed — check your AI settings.',
      })
    } finally {
      setStreamText('')
      setPhase('idle')
    }
  }

  const toggleVoice = () => {
    if (listening) {
      setListening(false)
      void ask('Summarize this week’s negative reviews')
    } else {
      setListening(true)
      pushToast({ tone: 'info', title: 'Listening…', body: 'Speak naturally — tap again to stop.' })
      setTimeout(() => setListening(false), 6000)
    }
  }

  const live = aiIsLive()

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="AI assistant"
          initial={{ x: '110%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '110%', opacity: 0.5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="glass-strong fixed top-4 right-4 bottom-4 z-[60] flex w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl shadow-float"
        >
          <div className="relative flex items-center gap-3 border-b border-edge px-5 py-4">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-pulse-500/12 to-transparent" />
            <div className="animate-orb relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-pulse-500 via-aura-500 to-cyan-glow shadow-glow-sm">
              <Sparkles size={18} className="text-pure" />
            </div>
            <div className="relative flex-1">
              <div className="font-display text-sm font-bold text-mist-50">Aria</div>
              <div className="flex items-center gap-1.5 text-[11px] text-mist-400">
                <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-mint-400' : 'bg-amber-glow')} />
                {live ? 'Live · powered by Claude' : 'Simulated · add an API key in Settings'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="relative grid h-8 w-8 place-items-center rounded-lg text-mist-400 transition-colors hover:bg-white/8 hover:text-mist-100"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
            {messages.length === 0 && phase === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-6"
              >
                <div className="text-center">
                  <div className="font-display text-lg font-semibold text-mist-50">
                    Hi Mantoo{' '}
                    <span className="inline-block animate-[float-slow_3s_ease-in-out_infinite]">👋</span>
                  </div>
                  <p className="mx-auto mt-1 max-w-[260px] text-sm text-mist-400">
                    Ask me anything about your reviews, sentiment, or team performance.
                  </p>
                </div>
                <div className="space-y-2">
                  {assistantSuggestions.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      onClick={() => void ask(s)}
                      className="glass w-full rounded-xl px-4 py-3 text-left text-sm text-mist-200 transition-all duration-200 hover:border-pulse-400/40 hover:bg-pulse-500/10 hover:text-mist-50"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'rounded-br-md bg-gradient-to-br from-pulse-500 to-pulse-600 text-pure shadow-glow-sm'
                      : 'glass rounded-bl-md text-mist-100',
                  )}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}

            {phase === 'thinking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass w-fit rounded-2xl rounded-bl-md px-3 py-1"
              >
                <ThinkingDots />
              </motion.div>
            )}
            {phase === 'streaming' && (
              <div className="glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-mist-100">
                  {streamText}
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-pulse-300 align-middle" />
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-edge p-4">
            <div className="glass flex items-center gap-2 rounded-2xl p-1.5 transition-colors focus-within:border-pulse-400/40">
              <button
                onClick={toggleVoice}
                aria-label="Voice input"
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all',
                  listening
                    ? 'bg-rose-glow/20 text-rose-glow shadow-[0_0_14px_rgb(251_109_136/0.4)]'
                    : 'text-mist-400 hover:bg-white/8 hover:text-mist-100',
                )}
              >
                {listening ? <Square size={14} /> : <Mic size={16} />}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void ask(input)}
                placeholder={listening ? 'Listening…' : 'Ask Aria anything…'}
                className="h-9 flex-1 bg-transparent text-sm text-mist-100 placeholder:text-mist-500 outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => void ask(input)}
                disabled={!input.trim() || phase !== 'idle'}
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pulse-500 to-aura-500 text-pure shadow-glow-sm transition-opacity disabled:opacity-40"
              >
                <Send size={15} />
              </motion.button>
            </div>
            <div className="mt-2 text-center text-[10px] text-mist-500">
              {live
                ? 'Responses generated by Claude using your workspace snapshot.'
                : 'Simulated responses — connect a Claude API key in Settings for live AI.'}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
