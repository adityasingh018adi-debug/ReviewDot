import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bot, Plug, Bell, Check, RotateCcw, Sparkles, Eye, EyeOff, Loader2, Store } from 'lucide-react'
import { useWorkspace, useToasts, DEFAULT_WIDGET_ORDER } from '@/store/workspace'
import { useAiConfig, testConnection, AI_MODELS, type AiModelId } from '@/lib/ai'
import { useBusiness, BUSINESS_TYPES } from '@/lib/business'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

function PanelHeader({
  icon: Icon,
  title,
  tint,
  right,
}: {
  icon: typeof User
  title: string
  tint: string
  right?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className={cn('grid h-8 w-8 place-items-center rounded-lg border border-edge bg-white/4', tint)}>
        <Icon size={15} />
      </span>
      <h3 className="font-display flex-1 text-sm font-semibold">{title}</h3>
      {right}
    </div>
  )
}

/** The business profile — everything in the app (AI included) adapts to this. */
function BusinessProfilePanel() {
  const type = useBusiness((s) => s.type)
  const name = useBusiness((s) => s.name)
  const setType = useBusiness((s) => s.setType)
  const setName = useBusiness((s) => s.setName)
  const pushToast = useToasts((s) => s.push)

  return (
    <GlassPanel
      className="p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}
    >
      <PanelHeader icon={Store} title="Business profile" tint="text-mint-400" />
      <p className="mb-4 -mt-2 text-xs leading-relaxed text-mist-400">
        The AI adapts its insights, action suggestions, and reply tone to your type of business.
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="biz-name" className="mb-1.5 block text-xs font-medium text-mist-300">
            Business name
          </label>
          <input
            id="biz-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full max-w-sm rounded-xl border border-edge bg-white/4 px-3 text-sm text-mist-100 outline-none transition-colors focus:border-pulse-400/50"
          />
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-mist-300">Business type</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BUSINESS_TYPES.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setType(b.id)
                  pushToast({
                    tone: 'success',
                    title: `Switched to ${b.label}`,
                    body: 'AI insights and analytics re-tuned for your industry.',
                  })
                }}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-3 text-left transition-all duration-200',
                  type === b.id
                    ? 'border-pulse-400/50 bg-pulse-500/12 shadow-glow-sm'
                    : 'border-edge bg-white/3 hover:border-white/20',
                )}
              >
                <span className="text-lg">{b.emoji}</span>
                <span className="text-xs font-semibold text-mist-100">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}

/** Bring-your-own-key Claude configuration. The key stays in this browser only. */
function AiConnectionPanel() {
  const apiKey = useAiConfig((s) => s.apiKey)
  const model = useAiConfig((s) => s.model)
  const setApiKey = useAiConfig((s) => s.setApiKey)
  const setModel = useAiConfig((s) => s.setModel)
  const pushToast = useToasts((s) => s.push)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    const error = await testConnection()
    setTesting(false)
    if (error) pushToast({ tone: 'error', title: 'Connection failed', body: error })
    else pushToast({ tone: 'success', title: 'Connected to Claude', body: 'Aria is now powered by live AI.' })
  }

  return (
    <GlassPanel
      className="p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.09, duration: 0.3 }}
    >
      <PanelHeader
        icon={Sparkles}
        title="Claude connection"
        tint="text-pulse-300"
        right={apiKey ? <Badge tone="positive">Live AI</Badge> : <Badge tone="warning">Simulated</Badge>}
      />
      <p className="mb-4 -mt-2 text-xs leading-relaxed text-mist-400">
        Add an Anthropic API key to power Aria, review summaries, and reply drafting with real Claude models.
        The key is stored only in this browser and sent only to Anthropic.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="ai-key" className="mb-1.5 block text-xs font-medium text-mist-300">
            API key
          </label>
          <div className="relative">
            <input
              id="ai-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-xl border border-edge bg-white/4 pr-10 pl-3 font-mono text-sm text-mist-100 placeholder:text-mist-500 transition-colors outline-none focus:border-pulse-400/50"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-mist-500 transition-colors hover:text-mist-200"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium text-mist-300">Model</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {AI_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id as AiModelId)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all duration-200',
                  model === m.id
                    ? 'border-pulse-400/50 bg-pulse-500/12 shadow-glow-sm'
                    : 'border-edge bg-white/3 hover:border-white/20',
                )}
              >
                <div className="text-xs font-semibold text-mist-100">{m.label}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-mist-400">{m.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" disabled={!apiKey || testing} onClick={() => void runTest()}>
            {testing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {testing ? 'Testing…' : 'Test connection'}
          </Button>
          {apiKey && (
            <Button variant="ghost" size="sm" onClick={() => setApiKey('')}>
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        on ? 'bg-gradient-to-r from-pulse-500 to-aura-500 shadow-glow-sm' : 'bg-white/10',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-pure shadow',
          on ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

const INTEGRATIONS = ['Google Business Profile', 'Facebook', 'TripAdvisor', 'Trustpilot'] as const

export function Settings() {
  const pushToast = useToasts((s) => s.push)
  const setWidgetOrder = useWorkspace((s) => s.setWidgetOrder)
  const [prefs, setPrefs] = useState({
    autoDraft: true,
    toneMatch: true,
    newReview: true,
    negativeAlert: true,
    weeklyReport: true,
  })
  const [connected, setConnected] = useState<Record<string, boolean>>({
    'Google Business Profile': true,
    Facebook: true,
    TripAdvisor: false,
    Trustpilot: true,
  })

  const set = (key: keyof typeof prefs) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [key]: v }))
    pushToast({ tone: 'success', title: 'Preference saved', body: 'Synced to your workspace instantly.' })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-mist-400">Business profile, AI, notifications, and integrations.</p>
      </motion.div>

      <GlassPanel
        className="p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03, duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-glow/70 to-pulse-500 text-lg font-bold text-pure ring-2 ring-white/10">
            MS
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-mist-50">Mantoo Singh</span>
              <Badge tone="accent">Owner</Badge>
            </div>
            <div className="text-sm text-mist-400">mantoosingh018@gmail.com</div>
          </div>
          <Button variant="glass" size="sm">
            <User size={13} /> Edit profile
          </Button>
        </div>
      </GlassPanel>

      <BusinessProfilePanel />
      <AiConnectionPanel />

      <GlassPanel
        className="p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
      >
        <PanelHeader icon={Bot} title="AI behavior" tint="text-aura-400" />
        <div className="space-y-4">
          {(
            [
              ['autoDraft', 'Auto-draft replies', 'Aria drafts a reply for every incoming review'],
              ['toneMatch', 'Tone matching', 'Match each customer’s writing style and formality'],
            ] as const
          ).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-mist-100">{label}</div>
                <div className="text-xs text-mist-400">{desc}</div>
              </div>
              <Toggle on={prefs[key]} onChange={set(key)} label={label} />
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel
        className="p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <PanelHeader icon={Bell} title="Notifications" tint="text-cyan-glow" />
        <div className="space-y-4">
          {(
            [
              ['newReview', 'New review alerts', 'Get notified the moment a review is published'],
              ['negativeAlert', 'Negative review alerts', 'Instant alert for any review of 2★ or below'],
              ['weeklyReport', 'Weekly reports', 'A Monday-morning digest of your reputation performance'],
            ] as const
          ).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-mist-100">{label}</div>
                <div className="text-xs text-mist-400">{desc}</div>
              </div>
              <Toggle on={prefs[key]} onChange={set(key)} label={label} />
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel
        className="p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
      >
        <PanelHeader icon={Plug} title="Integrations" tint="text-mint-400" />
        <div className="divide-y divide-white/6">
          {INTEGRATIONS.map((name) => {
            const isOn = connected[name]
            return (
              <div key={name} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-medium text-mist-100">{name}</div>
                  <div className="text-xs text-mist-500">
                    {isOn ? 'Connected · syncing reviews automatically' : 'Not connected'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOn && (
                    <Badge tone="positive">
                      <Check size={11} /> Connected
                    </Badge>
                  )}
                  <Button
                    variant={isOn ? 'ghost' : 'glass'}
                    size="sm"
                    onClick={() => {
                      setConnected((c) => ({ ...c, [name]: !isOn }))
                      pushToast({
                        tone: isOn ? 'info' : 'success',
                        title: isOn ? `${name} disconnected` : `${name} connected`,
                        body: isOn ? 'Reviews will no longer sync.' : 'Reviews are now syncing.',
                      })
                    }}
                  >
                    {isOn ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </GlassPanel>

      <GlassPanel
        className="p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.21, duration: 0.3 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-mist-100">Reset dashboard layout</div>
            <div className="text-xs text-mist-400">Restore the default widget arrangement</div>
          </div>
          <Button
            variant="glass"
            size="sm"
            onClick={() => {
              setWidgetOrder([...DEFAULT_WIDGET_ORDER])
              pushToast({
                tone: 'success',
                title: 'Layout reset',
                body: 'Dashboard widgets restored to default.',
              })
            }}
          >
            <RotateCcw size={13} /> Reset
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
