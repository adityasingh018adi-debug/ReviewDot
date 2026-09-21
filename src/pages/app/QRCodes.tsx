import { useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  FileText,
  Link2,
  Pause,
  Play,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { PageHeader } from '@/components/layout/PageHeader'
import { QRPreview } from '@/components/qr/QRPreview'
import { TableCard } from '@/components/qr/TableCard'
import { business, outletById, outlets, products, qrStats } from '@/lib/data'
import { displayUrl, scanUrl } from '@/lib/links'
import { downloadQRPng, downloadQRSvg, printQRSheet } from '@/lib/export'
import { useApp, useQRCodes } from '@/store/app'
import { useCopy } from '@/lib/hooks'
import type { Destination, QRCodeRecord, QRStatus, QRType } from '@/lib/types'
import { cn, formatNumber, relativeTime } from '@/lib/utils'

const TYPE_LABELS: Record<QRType, string> = {
  outlet: 'Outlet QR',
  table: 'Table QR',
  product: 'Product QR',
  packaging: 'Packaging QR',
  bill: 'Bill QR',
  campaign: 'Campaign QR',
}

const STATUS_TONE: Record<QRStatus, 'positive' | 'warning' | 'neutral'> = {
  active: 'positive',
  paused: 'warning',
  archived: 'neutral',
}

export function QRCodes() {
  const codes = useQRCodes()
  const createQR = useApp((s) => s.createQR)
  const patchQR = useApp((s) => s.patchQR)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<QRType | 'all'>('all')
  const [status, setStatus] = useState<QRStatus | 'all'>('all')
  const [selected, setSelected] = useState<QRCodeRecord | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return codes.filter((code) => {
      if (type !== 'all' && code.type !== type) return false
      if (status !== 'all' && code.status !== status) return false
      if (!needle) return true
      return `${code.label} ${code.code} ${code.location ?? ''} ${code.campaign ?? ''}`
        .toLowerCase()
        .includes(needle)
    })
  }, [codes, query, type, status])

  const active = codes.filter((code) => code.status === 'active').length

  return (
    <div>
      <PageHeader
        title="QR Codes"
        description={`${codes.length} codes · ${active} active · dynamic destinations, so nothing is ever reprinted`}
        action={
          <Button size="sm" onClick={() => setBuilderOpen(true)}>
            <Plus size={15} /> Create QR
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <Input
              className="pl-9"
              placeholder="Search label, code, table…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search QR codes"
            />
          </div>
          <Select
            value={type}
            onChange={(event) => setType(event.target.value as QRType | 'all')}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as QRStatus | 'all')}
            aria-label="Filter by status"
          >
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 36).map((code) => {
            const stats = qrStats(code.id)
            return (
              <button
                key={code.id}
                onClick={() => setSelected(code)}
                className="rounded-3xl border border-line bg-surface p-5 text-left shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-start gap-4">
                  <span className="rounded-2xl border border-line p-2">
                    <QRPreview value={scanUrl(code.code)} size={64} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[code.status]}>{code.status}</Badge>
                      <span className="text-[11px] text-faint">{TYPE_LABELS[code.type]}</span>
                    </span>
                    <span className="mt-2 block truncate text-[14px] font-medium text-ink">{code.label}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">{displayUrl(code.code)}</span>
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  <span>
                    <span className="block text-[15px] font-semibold tabular-nums text-ink">
                      {formatNumber(stats.scans)}
                    </span>
                    <span className="block text-[11px] text-faint">scans</span>
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold tabular-nums text-ink">
                      {formatNumber(stats.reviews)}
                    </span>
                    <span className="block text-[11px] text-faint">reviews</span>
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold tabular-nums text-ink">
                      {stats.rating ? stats.rating.toFixed(1) : '—'}
                    </span>
                    <span className="block text-[11px] text-faint">rating</span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <Empty
          title="No QR codes match"
          detail="Try a different type or status filter."
          action={
            <Button size="sm" onClick={() => setBuilderOpen(true)}>
              Create a QR code
            </Button>
          }
        />
      )}

      <QRBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onCreate={(draft) => {
          const record = createQR(draft)
          setBuilderOpen(false)
          setSelected(record)
        }}
      />

      <QRDetail
        code={selected}
        onClose={() => setSelected(null)}
        onPatch={(patch) => {
          if (!selected) return
          patchQR(selected.id, patch)
          setSelected({ ...selected, ...patch })
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function QRBuilder({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (draft: {
    label: string
    type: QRType
    outletId: string
    productId?: string
    location?: string
    campaign?: string
    destination: Destination
    destinationUrl: string
  }) => void
}) {
  const [type, setType] = useState<QRType>('table')
  const [outletId, setOutletId] = useState(outlets[0].id)
  const [location, setLocation] = useState('Table 01')
  const [productId, setProductId] = useState('')
  const [campaign, setCampaign] = useState('')
  const [destination, setDestination] = useState<Destination>('google')
  const [destinationUrl, setDestinationUrl] = useState('https://g.page/r/love-and-latte/review')

  const outlet = outletById(outletId)
  const label = [outlet?.name, location || TYPE_LABELS[type]].filter(Boolean).join(' — ')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a QR code"
      subtitle="Every code carries its outlet, location and product, so feedback arrives with full context."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onCreate({
                label,
                type,
                outletId,
                productId: productId || undefined,
                location: location || undefined,
                campaign: campaign || undefined,
                destination,
                destinationUrl,
              })
            }
          >
            Generate QR
          </Button>
        </div>
      }
    >
      <div className="grid gap-5 sm:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Field label="Business">
            <Input value={business.name} readOnly aria-label="Business" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="QR type">
              <Select value={type} onChange={(event) => setType(event.target.value as QRType)}>
                {Object.entries(TYPE_LABELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Outlet">
              <Select value={outletId} onChange={(event) => setOutletId(event.target.value)}>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" hint="Table number, counter, packaging…">
              <Input value={location} onChange={(event) => setLocation(event.target.value)} />
            </Field>
            <Field label="Product" hint="Optional — ties reviews to one item">
              <Select value={productId} onChange={(event) => setProductId(event.target.value)}>
                <option value="">Any product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Campaign" hint="Optional — groups codes for reporting">
            <Input
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="e.g. Monsoon Menu 2026"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination">
              <Select
                value={destination}
                onChange={(event) => setDestination(event.target.value as Destination)}
              >
                <option value="google">Google review page</option>
                <option value="instagram">Instagram profile</option>
                <option value="custom">Custom link</option>
              </Select>
            </Field>
            <Field label="Destination link">
              <Input value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-raised p-5 text-center">
          <p className="text-[12px] font-medium text-muted">Preview</p>
          <div className="mt-4">
            <TableCard
              code="preview"
              headline={label || 'New QR code'}
              size="sm"
              linkLabel="short link assigned on generate"
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            The short link is assigned when you generate the code, and can be re-pointed later without reprinting.
          </p>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */

function QRDetail({
  code,
  onClose,
  onPatch,
}: {
  code: QRCodeRecord | null
  onClose: () => void
  onPatch: (patch: Partial<QRCodeRecord>) => void
}) {
  const { copied, copy } = useCopy()
  if (!code) return null
  const stats = qrStats(code.id)
  const outlet = outletById(code.outletId)
  const url = scanUrl(code.code)

  return (
    <Modal open onClose={onClose} title={code.label} subtitle={`${TYPE_LABELS[code.type]} · ${outlet?.name}`} size="lg">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="mx-auto rounded-3xl border border-line p-4 sm:mx-0">
          <QRPreview value={url} size={168} />
          <p className="mt-3 text-center text-[12px] text-muted">{displayUrl(code.code)}</p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Scans', value: formatNumber(stats.scans) },
              { label: 'Reviews', value: formatNumber(stats.reviews) },
              { label: 'Rating', value: stats.rating ? stats.rating.toFixed(1) : '—' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-raised px-3 py-3">
                <p className="font-display text-[20px] font-semibold tabular-nums text-ink">{item.value}</p>
                <p className="mt-0.5 text-[11px] text-faint">{item.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-[12px] font-medium text-ink-soft">Status</p>
            <div className="flex gap-2">
              {(['active', 'paused', 'archived'] as QRStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => onPatch({ status })}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium capitalize transition-colors',
                    code.status === status
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-muted hover:text-ink',
                  )}
                >
                  {status === 'active' ? <Play size={13} /> : status === 'paused' ? <Pause size={13} /> : <Trash2 size={13} />}
                  {status}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-faint">
              Paused codes show a friendly message instead of collecting feedback. Nothing needs reprinting.
            </p>
          </div>

          <Field label="Linked product" hint="Change what this printed code reviews — instantly.">
            <Select
              value={code.productId ?? ''}
              onChange={(event) => onPatch({ productId: event.target.value || undefined })}
            >
              <option value="">Any product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Public review destination">
            <Select
              value={code.destination}
              onChange={(event) => onPatch({ destination: event.target.value as Destination })}
            >
              <option value="google">Google review page</option>
              <option value="instagram">Instagram profile</option>
              <option value="custom">Custom link</option>
            </Select>
          </Field>

          <p className="text-[12px] text-faint">Created {relativeTime(code.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        <Button size="sm" variant="secondary" onClick={() => downloadQRPng(url, `${code.code}.png`)}>
          <Download size={15} /> Download PNG
        </Button>
        <Button size="sm" variant="secondary" onClick={() => downloadQRSvg(url, `${code.code}.svg`)}>
          <FileText size={15} /> Download SVG
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            printQRSheet({
              businessName: business.name,
              title: code.location ?? code.label,
              subtitle: 'Loved your experience?',
              url,
              footnote: 'Your feedback helps us grow ❤️',
            })
          }
        >
          <Printer size={15} /> Print / PDF
        </Button>
        <Button size="sm" variant="secondary" onClick={() => copy(`https://${displayUrl(code.code)}`)}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy link'}
        </Button>
        <a
          href={`#/r/${code.code}`}
          className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
        >
          <Link2 size={14} /> Open customer view
        </a>
      </div>
    </Modal>
  )
}

export const QR_TYPE_LABELS = TYPE_LABELS
