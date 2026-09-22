'use client'

import { useState } from 'react'
import { Check, Moon, RotateCcw, Sun } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field, Input, Select, Toggle } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import { business, outlets, teamMembers } from '@/lib/data'
import { useApp } from '@/store/app'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const resetDemo = useApp((s) => s.resetDemo)

  const [alerts, setAlerts] = useState({ newReview: true, lowRating: true, weekly: true, campaign: false })

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Workspace, outlets, review destinations and integrations." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Business profile" subtitle="Shown on QR cards and the customer experience" />
          <div className="space-y-4">
            <Field label="Business name">
              <Input defaultValue={business.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Input defaultValue={business.category} />
              </Field>
              <Field label="Plan">
                <Select defaultValue={business.plan}>
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Scale</option>
                </Select>
              </Field>
            </div>
            <Field label="Handwritten note on QR cards" hint="Appears under the QR code on printed material.">
              <Input defaultValue="Your feedback helps us grow ❤️" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Appearance" subtitle="Applies to this browser" />
          <div className="grid grid-cols-2 gap-3">
            {(['light', 'dark'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-[13px] font-medium capitalize transition-colors',
                  theme === option
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-muted hover:text-ink',
                )}
              >
                {option === 'light' ? <Sun size={15} /> : <Moon size={15} />} {option}
              </button>
            ))}
          </div>

          <CardHeader className="mb-4 mt-8" title="Notifications" subtitle="Who hears about what, and when" />
          <ul className="space-y-3">
            {[
              { key: 'newReview' as const, label: 'New review collected' },
              { key: 'lowRating' as const, label: 'Rating of 3★ or below' },
              { key: 'weekly' as const, label: 'Weekly outlet digest' },
              { key: 'campaign' as const, label: 'Campaign milestones' },
            ].map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-ink-soft">{item.label}</span>
                <Toggle
                  checked={alerts[item.key]}
                  label={item.label}
                  onChange={(value) => setAlerts({ ...alerts, [item.key]: value })}
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Outlets & review destinations" subtitle="Where satisfied customers are sent" />
        <div className="space-y-3">
          {outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-ink">{outlet.name}</p>
                <p className="text-[12px] text-muted">{outlet.address}</p>
              </div>
              <span className="flex items-center gap-2 text-[13px] text-ink-soft">
                <GoogleGlyph size={15} /> {outlet.googlePlace}
              </span>
              <Badge tone="positive">
                <Check size={11} /> Connected
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Team" subtitle="Who can see and act on feedback" />
          <ul className="space-y-3">
            {teamMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{member.name}</span>
                  <span className="block truncate text-[12px] text-muted">{member.email}</span>
                </span>
                <span className="text-right">
                  <Badge>{member.role}</Badge>
                  <span className="mt-1 block text-[11px] text-faint">{member.outlet}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="AI"
            subtitle="Review drafting and the workspace analyst run on ReviewDot's servers."
          />
          <p className="text-[13px] leading-relaxed text-muted">
            The model key lives in the server environment and is never sent to a browser. Drafts are checked before
            they reach a customer: anything the customer did not say — a price, a wait time, a rating — is rejected.
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[14px] font-semibold text-ink">Demo data</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Reset the QR campaigns you created and the feedback you submitted through the scan experience. The
              seeded history stays.
            </p>
            <Button variant="secondary" className="mt-4" onClick={resetDemo}>
              <RotateCcw size={15} /> Reset local changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
