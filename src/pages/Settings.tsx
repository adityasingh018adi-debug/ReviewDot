import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bot, Plug, Bell, Check, RotateCcw } from 'lucide-react'
import { useWorkspace, useToasts, DEFAULT_WIDGET_ORDER } from '@/store/workspace'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

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
        className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', on ? 'left-[22px]' : 'left-0.5')}
      />
    </button>
  )
}

const integrations = [
  { name: 'Google Business Profile', status: 'connected', synced: '2 min ago' },
  { name: 'Trustpilot', status: 'connected', synced: '11 min ago' },
  { name: 'G2', status: 'connected', synced: '1 h ago' },
  { name: 'App Store Connect', status: 'attention', synced: '2 d ago' },
  { name: 'Capterra', status: 'connected', synced: '26 min ago' },
]

export function Settings() {
  const pushToast = useToasts((s) => s.push)
  const setWidgetOrder = useWorkspace((s) => s.setWidgetOrder)
  const [prefs, setPrefs] = useState({
    autoDraft: true,
    toneMatch: true,
    autoPublish: false,
    digest: true,
    slaAlerts: true,
    mentions: false,
  })

  const set = (key: keyof typeof prefs) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [key]: v }))
    pushToast({ tone: 'success', title: 'Preference saved', body: 'Synced to your workspace instantly.' })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-mist-400">Workspace, AI behavior, and integrations.</p>
      </motion.div>

      <GlassPanel className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-glow/70 to-pulse-500 text-lg font-bold text-white ring-2 ring-white/10">
            MS
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-mist-50">Mantoo Singh</span>
              <Badge tone="accent">Enterprise</Badge>
            </div>
            <div className="text-sm text-mist-400">mantoosingh018@gmail.com · Workspace owner</div>
          </div>
          <Button variant="glass" size="sm">
            <User size={13} /> Edit profile
          </Button>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-aura-400">
            <Bot size={15} />
          </span>
          <h3 className="font-display text-sm font-semibold">AI behavior</h3>
        </div>
        <div className="space-y-4">
          {(
            [
              ['autoDraft', 'Auto-draft replies', 'Aria drafts a reply for every incoming review'],
              ['toneMatch', 'Tone matching', 'Match each customer’s writing style and formality'],
              ['autoPublish', 'Auto-publish 5★ replies', 'Publish drafts for top-rated reviews without approval'],
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

      <GlassPanel className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-cyan-glow">
            <Bell size={15} />
          </span>
          <h3 className="font-display text-sm font-semibold">Notifications</h3>
        </div>
        <div className="space-y-4">
          {(
            [
              ['digest', 'Weekly AI digest', 'Monday-morning summary of trends and actions'],
              ['slaAlerts', 'SLA alerts', 'Warn when reviews approach the response deadline'],
              ['mentions', 'Competitor mentions', 'Notify when reviews reference competitors'],
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

      <GlassPanel className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/4 text-mint-400">
            <Plug size={15} />
          </span>
          <h3 className="font-display text-sm font-semibold">Connected sources</h3>
        </div>
        <div className="divide-y divide-white/6">
          {integrations.map((it, i) => (
            <motion.div
              key={it.name}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <div className="text-sm font-medium text-mist-100">{it.name}</div>
                <div className="text-xs text-mist-500">Last synced {it.synced}</div>
              </div>
              {it.status === 'connected' ? (
                <Badge tone="positive">
                  <Check size={11} /> Connected
                </Badge>
              ) : (
                <Badge tone="warning">Needs attention</Badge>
              )}
            </motion.div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
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
              pushToast({ tone: 'success', title: 'Layout reset', body: 'Dashboard widgets restored to default.' })
            }}
          >
            <RotateCcw size={13} /> Reset
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
