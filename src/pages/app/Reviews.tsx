import { useMemo, useState } from 'react'
import { Download, Search, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'
import { PageHeader } from '@/components/layout/PageHeader'
import { EntryRow } from '@/components/dashboard/EntryRow'
import { entriesIn } from '@/lib/metrics'
import { outletById, productById, products } from '@/lib/data'
import { useDataSet, useScope } from '@/store/app'
import { downloadCSV } from '@/lib/export'
import { formatNumber } from '@/lib/utils'

const PAGE_SIZE = 12

export function Reviews() {
  const scope = useScope()
  const data = useDataSet()
  const [query, setQuery] = useState('')
  const [rating, setRating] = useState('all')
  const [productId, setProductId] = useState('all')
  const [channel, setChannel] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const all = useMemo(() => entriesIn(scope, data).filter((entry) => entry.kind === 'review'), [scope, data])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return all.filter((entry) => {
      if (rating !== 'all' && entry.rating !== Number(rating)) return false
      if (productId !== 'all' && entry.productId !== productId) return false
      if (channel === 'public' && !entry.publicClick) return false
      if (channel === 'private' && entry.publicClick) return false
      if (!needle) return true
      const product = productById(entry.productId)?.name ?? ''
      const outlet = outletById(entry.outletId)?.name ?? ''
      return `${entry.comment} ${entry.tags.join(' ')} ${product} ${outlet}`.toLowerCase().includes(needle)
    })
  }, [all, query, rating, productId, channel])

  const publicShare = all.length ? all.filter((entry) => entry.publicClick).length / all.length : 0

  const exportCSV = () =>
    downloadCSV(
      filtered.map((entry) => ({
        date: entry.createdAt,
        rating: entry.rating,
        product: productById(entry.productId)?.name ?? '',
        outlet: outletById(entry.outletId)?.name ?? '',
        tags: entry.tags.join(' | '),
        comment: entry.comment,
        continued_to: entry.publicClick ? (entry.destination ?? 'google') : '',
      })),
      'reviewdot-reviews.csv',
    )

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={`${formatNumber(all.length)} reviews in ${scope.range.label.toLowerCase()} · ${Math.round(publicShare * 100)}% continued to a public platform`}
        action={
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <Input
              className="pl-9"
              placeholder="Search comments, tags, products…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setVisible(PAGE_SIZE)
              }}
              aria-label="Search reviews"
            />
          </div>
          <Select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Filter by rating">
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
          </Select>
          <Select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            aria-label="Filter by product"
          >
            <option value="all">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="Filter by outcome">
            <option value="all">Every outcome</option>
            <option value="public">Continued to a public platform</option>
            <option value="private">Stayed in ReviewDot</option>
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Badge tone="positive">
            <Star size={11} className="fill-current" /> {formatNumber(filtered.length)} matching
          </Badge>
          {rating !== 'all' || productId !== 'all' || channel !== 'all' || query ? (
            <button
              className="text-[12px] font-medium text-accent hover:underline"
              onClick={() => {
                setQuery('')
                setRating('all')
                setProductId('all')
                setChannel('all')
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </Card>

      {filtered.length ? (
        <>
          <div className="space-y-3">
            {filtered.slice(0, visible).map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
          {visible < filtered.length ? (
            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
                Load more ({formatNumber(filtered.length - visible)} left)
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <Empty
          title="No reviews match these filters"
          detail="Try widening the date range in the top bar, or clearing the product filter."
        />
      )}
    </div>
  )
}
