'use client'

import { useState, type FormEvent } from 'react'
import { Archive, Check, Copy, Download, Pause, Play, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { QRPreview } from '@/components/qr/QRPreview'
import { useCopy } from '@/lib/hooks'
import { formatNumber } from '@/lib/utils'
import { scanUrl } from '@/lib/links'
import {
  createCampaignAction,
  setCampaignStatusAction,
  updateCampaignAction,
} from '@/app-actions/workspace'
import type { CampaignRow, OutletOption } from '@/services/dashboard'
import { OutletPicker } from '@/components/layout/ScopePickers'
import { qrSvg } from '@/lib/qr'

/**
 * QR campaigns, from the database.
 *
 * A code is dynamic: the printed card holds only `/r/{publicId}`, and
 * everything it resolves to — outlet, destination, whether it accepts feedback
 * at all — lives in the row. Pausing one stops collection without anyone
 * reprinting anything, which is what `app_campaign_is_live()` enforces at the
 * other end.
 */

const TYPES = [
  { value: 'table', label: 'Table' },
  { value: 'counter', label: 'Counter' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'staff', label: 'Staff card' },
  { value: 'product', label: 'Product' },
  { value: 'event', label: 'Event' },
  { value: 'custom', label: 'Custom' },
]

export function CampaignsLive({
  campaigns,
  outlets,
  canManage,
}: {
  campaigns: CampaignRow[]
  outlets: OutletOption[]
  canManage: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CampaignRow | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR studio"
        description="Every code, where it sits and how it is doing"
        action={
          <>
            <OutletPicker />
            {canManage && outlets.length ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={15} /> New QR code
            </Button>
          ) : null}
          </>
        }
      />

      {!outlets.length ? (
        <Card>
          <Empty
            title="Add an outlet first"
            detail="A QR code belongs to an outlet, so that a scan knows which location it came from."
          />
        </Card>
      ) : campaigns.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              canManage={canManage}
              onEdit={() => setEditing(campaign)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            title="No QR codes yet"
            detail="Create one, print it, and put it where customers finish their visit — a table, a receipt, a takeaway bag."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus size={15} /> Create your first code
                </Button>
              ) : null
            }
          />
        </Card>
      )}

      {creating ? <CampaignDialog outlets={outlets} onClose={() => setCreating(false)} /> : null}
      {editing ? (
        <CampaignDialog outlets={outlets} campaign={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  )
}

function CampaignCard({
  campaign,
  canManage,
  onEdit,
}: {
  campaign: CampaignRow
  canManage: boolean
  onEdit: () => void
}) {
  const { copied, copy } = useCopy()
  const [pending, setPending] = useState(false)
  const url = scanUrl(campaign.publicId)

  const setStatus = async (status: string) => {
    const form = new FormData()
    form.set('id', campaign.id)
    form.set('status', status)
    setPending(true)
    try {
      await setCampaignStatusAction(form)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        {/* dark on light in both themes — inverted codes fail on many scanners */}
        <QRPreview value={url} size={72} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{campaign.name}</p>
          <p className="truncate text-[12px] text-muted">
            {campaign.outletName}
            {campaign.placement ? ` · ${campaign.placement}` : ''}
          </p>
          <p className="mt-1 truncate font-mono text-[11px] text-faint">{campaign.referenceCode}</p>
        </div>
        <Badge tone={campaign.status === 'active' ? 'positive' : 'neutral'}>{campaign.status}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">Scans</dt>
          <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-ink">
            {formatNumber(campaign.scans)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">Reviews</dt>
          <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-ink">
            {formatNumber(campaign.reviews)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">Posted</dt>
          <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-ink">
            {formatNumber(campaign.clicks)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => downloadQR(url, campaign.referenceCode)}>
          <Download size={14} /> Download
        </Button>
        <Button size="sm" variant="secondary" onClick={() => copy(url)}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}
        </Button>
        {canManage ? (
          <>
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setStatus(campaign.status === 'active' ? 'paused' : 'active')}
            >
              {campaign.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
              {campaign.status === 'active' ? 'Pause' : 'Resume'}
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus('archived')}>
              <Archive size={14} /> Archive
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  )
}

function CampaignDialog({
  campaign,
  outlets,
  onClose,
}: {
  campaign?: CampaignRow
  outlets: OutletOption[]
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    setPending(true)
    try {
      const result = campaign ? await updateCampaignAction(form) : await createCampaignAction(form)
      if (result?.error) setError(result.error)
      else onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={campaign ? 'Edit QR code' : 'New QR code'}>
      <form className="space-y-4" onSubmit={onSubmit}>
        {campaign ? <input type="hidden" name="id" value={campaign.id} /> : null}

        <Field label="Name" hint="What you'll call it in here — customers never see this.">
          <Input name="name" defaultValue={campaign?.name ?? ''} placeholder="Table 04" required />
        </Field>

        {campaign ? null : (
          <>
            <Field label="Outlet">
              <Select name="outletId" required defaultValue={outlets[0]?.id}>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Where does it go?">
              <Select name="type" defaultValue="table">
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        <Field label="Placement" hint="Printed on the card, e.g. Table 04.">
          <Input name="placement" defaultValue={campaign?.placement ?? ''} placeholder="Table 04" />
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
            {pending ? 'Saving…' : campaign ? 'Save' : 'Create code'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}


/**
 * Saves the code as an SVG.
 *
 * Vector rather than PNG because these get printed — on a table card, a bill
 * footer, a packaging sleeve — and a raster export is the reason a code that
 * scanned fine on screen fails at the table. Dark on light regardless of the
 * dashboard theme: inverted codes defeat many phone scanners.
 */
function downloadQR(url: string, reference: string) {
  const svg = qrSvg(url, { size: 1024 })
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = `${reference || 'reviewdot'}.svg`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}
