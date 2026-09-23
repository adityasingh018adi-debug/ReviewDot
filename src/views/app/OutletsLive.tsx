'use client'

import { useState, type FormEvent } from 'react'
import { Building2, MapPin, Pause, Play, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { formatNumber } from '@/lib/utils'
import { createOutletAction, setOutletStatusAction, updateOutletAction } from '@/app-actions/workspace'
import type { OutletDetail } from '@/services/dashboard'

/**
 * Outlets, from the database.
 *
 * Writes go through server actions, so what a viewer is allowed to change is
 * decided by `outlets_write` rather than by which buttons this renders. The
 * buttons follow the same rule so the UI does not offer something the database
 * will refuse, but the database is what enforces it.
 */
export function OutletsLive({
  outlets,
  canManage,
}: {
  outlets: OutletDetail[]
  canManage: boolean
}) {
  const [editing, setEditing] = useState<OutletDetail | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outlets"
        description="Every location collecting feedback"
        action={
          canManage ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={15} /> Add outlet
            </Button>
          ) : null
        }
      />

      {outlets.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {outlets.map((outlet) => (
            <Card key={outlet.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <Building2 size={16} className="text-accent" /> {outlet.name}
                    <span className="rounded bg-raised px-1.5 py-0.5 font-mono text-[11px] text-muted">
                      {outlet.shortCode}
                    </span>
                  </p>
                  {outlet.city || outlet.address ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                      <MapPin size={12} /> {[outlet.address, outlet.city].filter(Boolean).join(', ')}
                    </p>
                  ) : null}
                </div>
                <Badge tone={outlet.status === 'active' ? 'positive' : 'neutral'}>{outlet.status}</Badge>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
                <Stat label="Scans" value={formatNumber(outlet.scans)} />
                <Stat label="Reviews" value={formatNumber(outlet.reviews)} />
                <Stat
                  label="Rating"
                  value={outlet.rating === null ? '—' : `${outlet.rating.toFixed(1)}★`}
                />
              </dl>

              <p className="mt-3 text-[12px] text-faint">
                {outlet.campaigns} QR {outlet.campaigns === 1 ? 'code' : 'codes'}
                {outlet.googleReviewUrl ? '' : ' · no review link set'}
              </p>

              {canManage ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(outlet)}>
                    Edit
                  </Button>
                  <StatusButton
                    id={outlet.id}
                    next={outlet.status === 'active' ? 'paused' : 'active'}
                    label={outlet.status === 'active' ? 'Pause' : 'Resume'}
                    icon={outlet.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            title="No outlets yet"
            detail="An outlet is a location — one café, one branch, one kitchen. Everything else hangs off it."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus size={15} /> Add your first outlet
                </Button>
              ) : null
            }
          />
        </Card>
      )}

      {creating ? <OutletDialog onClose={() => setCreating(false)} /> : null}
      {editing ? <OutletDialog outlet={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">{label}</dt>
      <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  )
}

function StatusButton({
  id,
  next,
  label,
  icon,
}: {
  id: string
  next: string
  label: string
  icon: React.ReactNode
}) {
  const [pending, setPending] = useState(false)

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        const form = new FormData()
        form.set('id', id)
        form.set('status', next)
        setPending(true)
        try {
          await setOutletStatusAction(form)
        } finally {
          setPending(false)
        }
      }}
    >
      {icon} {label}
    </Button>
  )
}

function OutletDialog({ outlet, onClose }: { outlet?: OutletDetail; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    setPending(true)
    try {
      const result = outlet ? await updateOutletAction(form) : await createOutletAction(form)
      if (result?.error) setError(result.error)
      else onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={outlet ? 'Edit outlet' : 'Add an outlet'}>
      <form className="space-y-4" onSubmit={onSubmit}>
        {outlet ? <input type="hidden" name="id" value={outlet.id} /> : null}
        <Field label="Name">
          <Input name="name" defaultValue={outlet?.name ?? ''} placeholder="Thane" required />
        </Field>
        <Field label="City">
          <Input name="city" defaultValue={outlet?.city ?? ''} placeholder="Thane West" />
        </Field>
        <Field label="Address">
          <Input name="address" defaultValue={outlet?.address ?? ''} placeholder="Ground floor, Viviana Mall" />
        </Field>
        <Field
          label="Google review link"
          hint="Where customers are sent to post. Find it in your Google Business Profile."
        >
          <Input
            name="googleReviewUrl"
            type="url"
            defaultValue={outlet?.googleReviewUrl ?? ''}
            placeholder="https://g.page/r/..."
          />
        </Field>
        {error ? (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : outlet ? 'Save outlet' : 'Create outlet'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

