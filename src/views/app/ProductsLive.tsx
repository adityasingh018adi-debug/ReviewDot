'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Package, Plus } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { saveProductAction, setProductActiveAction } from '@/app-actions/workspace'
import type { OutletOption, ProductRow } from '@/services/dashboard'
import { OutletPicker } from '@/components/layout/ScopePickers'

/**
 * Products, from the database.
 *
 * A product with no feedback yet still appears — "nobody has mentioned this"
 * is information, and hiding it would make the list look healthier than it is.
 */
export function ProductsLive({
  products,
  outlets,
  rangeLabel,
  canManage,
}: {
  products: ProductRow[]
  outlets: OutletOption[]
  rangeLabel: string
  canManage: boolean
}) {
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={`What customers are reviewing · ${rangeLabel}`}
        action={
          <>
            <OutletPicker />
            {canManage ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={15} /> Add product
            </Button>
          ) : null}
          </>
        }
      />

      <Card>
        <CardHeader
          title="Product intelligence"
          subtitle="Ranked by how much feedback mentions them"
          action={
            <span className="text-[12px] text-faint">
              {formatNumber(products.length)} {products.length === 1 ? 'product' : 'products'}
            </span>
          }
        />

        {products.length ? (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-2 py-2.5 font-medium">Product</th>
                  <th className="px-2 py-2.5 text-right font-medium">Reviews</th>
                  <th className="px-2 py-2.5 text-right font-medium">Rating</th>
                  <th className="px-2 py-2.5 text-right font-medium">Positive</th>
                  <th className="px-2 py-2.5 text-right font-medium">Private</th>
                  <th className="px-2 py-2.5 text-right font-medium">Scans</th>
                  <th className="px-2 py-2.5 text-right font-medium">Price</th>
                  {canManage ? <th className="px-2 py-2.5 text-right font-medium" /> : null}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-line last:border-0">
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                          <Package size={15} />
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/app/products/${product.id}`}
                            className="block truncate text-[14px] font-medium text-ink hover:text-accent"
                          >
                            {product.name}
                          </Link>
                          <span className="block truncate text-[11.5px] text-faint">
                            {product.category ?? 'Uncategorised'}
                          </span>
                        </span>
                        {product.isActive ? null : <Badge tone="neutral">hidden</Badge>}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-ink-soft">
                      {formatNumber(product.reviews)}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] font-medium tabular-nums text-ink">
                      {product.rating === null ? '—' : `${product.rating.toFixed(1)}★`}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-accent">
                      {product.reviews ? formatPercent(product.positive / product.reviews, 0) : '—'}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-ink-soft">
                      {formatNumber(product.privateFeedback)}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-ink-soft">
                      {formatNumber(product.scans)}
                    </td>
                    <td className="px-2 py-3 text-right text-[14px] tabular-nums text-ink-soft">
                      {product.priceCents === null ? '—' : formatCurrency(product.priceCents / 100)}
                    </td>
                    {canManage ? (
                      <td className="px-2 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(product)}>
                            Edit
                          </Button>
                          <ToggleActive product={product} />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No products yet"
            detail="Add what you sell, then point a QR code at one so feedback can be tied to it."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus size={15} /> Add a product
                </Button>
              ) : null
            }
          />
        )}
      </Card>

      {creating ? <ProductDialog outlets={outlets} onClose={() => setCreating(false)} /> : null}
      {editing ? (
        <ProductDialog product={editing} outlets={outlets} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  )
}

function ToggleActive({ product }: { product: ProductRow }) {
  const [pending, setPending] = useState(false)
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        const form = new FormData()
        form.set('id', product.id)
        form.set('active', String(!product.isActive))
        setPending(true)
        try {
          await setProductActiveAction(form)
        } finally {
          setPending(false)
        }
      }}
    >
      {product.isActive ? 'Hide' : 'Show'}
    </Button>
  )
}

function ProductDialog({
  product,
  outlets,
  onClose,
}: {
  product?: ProductRow
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
      const result = await saveProductAction(form)
      if (result?.error) setError(result.error)
      else onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={product ? 'Edit product' : 'Add a product'}>
      <form className="space-y-4" onSubmit={onSubmit}>
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <Field label="Name">
          <Input name="name" defaultValue={product?.name ?? ''} placeholder="Mango Cheesecake" required />
        </Field>
        <Field label="Category">
          <Input name="category" placeholder="Desserts" />
        </Field>
        <Field label="Price" hint="Optional, in whole currency units.">
          <Input name="price" type="number" min="0" step="0.01" placeholder="380" />
        </Field>
        <Field label="Outlet" hint="Leave as all outlets if you sell it everywhere.">
          <Select name="outletId" defaultValue={product?.outletId ?? ''}>
            <option value="">All outlets</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </Select>
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
            {pending ? 'Saving…' : product ? 'Save' : 'Add product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
