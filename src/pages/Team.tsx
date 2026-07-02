import { motion } from 'framer-motion'
import { UserPlus, Shield, Check, Minus, History } from 'lucide-react'
import { useToasts } from '@/store/workspace'
import { useDataset, seedActivity } from '@/lib/data'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, cn } from '@/lib/utils'

type Role = 'Owner' | 'Manager' | 'Agent' | 'Analyst'

const members: Array<{ name: string; email: string; role: Role; lastActive: string; online: boolean }> = [
  { name: 'Mantoo Singh', email: 'mantoosingh018@gmail.com', role: 'Owner', lastActive: 'now', online: true },
  { name: 'Elena Moreau', email: 'elena@reviewdot.ai', role: 'Manager', lastActive: '12m ago', online: true },
  { name: 'Marcus Berg', email: 'marcus@reviewdot.ai', role: 'Agent', lastActive: '1h ago', online: false },
  { name: 'Priya Patel', email: 'priya@reviewdot.ai', role: 'Analyst', lastActive: '3h ago', online: false },
]

const roleTone: Record<Role, 'accent' | 'info' | 'positive' | 'neutral'> = {
  Owner: 'accent',
  Manager: 'info',
  Agent: 'positive',
  Analyst: 'neutral',
}

const permissions: Array<{ label: string; roles: Record<Role, boolean> }> = [
  { label: 'View reviews & analytics', roles: { Owner: true, Manager: true, Agent: true, Analyst: true } },
  { label: 'Reply to reviews', roles: { Owner: true, Manager: true, Agent: true, Analyst: false } },
  { label: 'Approve AI drafts', roles: { Owner: true, Manager: true, Agent: false, Analyst: false } },
  { label: 'Export reports', roles: { Owner: true, Manager: true, Agent: false, Analyst: true } },
  { label: 'Manage integrations', roles: { Owner: true, Manager: true, Agent: false, Analyst: false } },
  { label: 'Manage team & billing', roles: { Owner: true, Manager: false, Agent: false, Analyst: false } },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
}

export function Team() {
  const pushToast = useToasts((s) => s.push)
  const dataset = useDataset()
  const activity = seedActivity(dataset)

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Team</h1>
          <p className="mt-1 text-sm text-mist-400">Who can see, reply to, and act on your reviews.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() =>
            pushToast({
              tone: 'success',
              title: 'Invitation sent',
              body: 'Your teammate will receive an email shortly.',
            })
          }
        >
          <UserPlus size={15} /> Invite member
        </Button>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel
          className="p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <h3 className="font-display mb-4 text-sm font-semibold">Members</h3>
          <div className="divide-y divide-white/6">
            {members.map((m, i) => (
              <motion.div
                key={m.email}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.25 }}
                className="flex items-center gap-3 py-3"
              >
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pulse-500/40 to-aura-500/40 text-xs font-bold text-mist-50 ring-1 ring-white/10">
                  {initials(m.name)}
                  {m.online && (
                    <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-mint-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-mist-100">{m.name}</div>
                  <div className="truncate text-xs text-mist-500">{m.email}</div>
                </div>
                <span className="hidden text-xs text-mist-500 sm:block">active {m.lastActive}</span>
                <Badge tone={roleTone[m.role]}>{m.role}</Badge>
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          className="p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <History size={15} className="text-cyan-glow" />
            <h3 className="font-display text-sm font-semibold">Activity log</h3>
          </div>
          <div className="space-y-3">
            {activity.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-mist-100">{e.text}</div>
                  <div className="text-[10px] text-mist-500">
                    {e.meta} · {timeAgo(e.at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          className="p-5 lg:col-span-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Shield size={15} className="text-mint-400" />
            <h3 className="font-display text-sm font-semibold">Roles & permissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-[11px] tracking-wider text-mist-500 uppercase">
                  <th className="pb-3 font-medium">Permission</th>
                  {(Object.keys(roleTone) as Role[]).map((r) => (
                    <th key={r} className="pb-3 text-center font-medium">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {permissions.map((p) => (
                  <tr key={p.label}>
                    <td className="py-2.5 text-mist-200">{p.label}</td>
                    {(Object.keys(roleTone) as Role[]).map((r) => (
                      <td key={r} className="py-2.5 text-center">
                        <span
                          className={cn(
                            'inline-grid h-5 w-5 place-items-center rounded-full',
                            p.roles[r] ? 'bg-mint-400/15 text-mint-400' : 'bg-white/5 text-mist-500',
                          )}
                        >
                          {p.roles[r] ? <Check size={11} /> : <Minus size={11} />}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
