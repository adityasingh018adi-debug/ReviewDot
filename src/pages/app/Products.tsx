import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Download, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'
import { Stars } from '@/components/ui/Stars'
import { byProduct } from '@/lib/metrics'
import { useDataSet, useScope } from '@/store/app'
import { downloadCSV } from '@/lib/export'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

type SortKey = 'reviews' | 'rating' | 'positive' | 'scans'

export function Products() {
  const scope = useScope()
  const data = useDataSet()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('reviews')

  const rows = useMemo(() => {
    const list = byProduct(scope, data).filter((row) =>
      `${row.name} ${row.category}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    return [...list].sort((a, b) => b[sort] - a[sort])
  }, [scope, data, query, sort])

  const header = (key: SortKey, label: string, hint?: string) => (
    <th className="px-3 py-3 text-right font-medium" title={hint}>
      <button
        onClick={() => setSort(key)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-ink',
          sort === key ? 'text-ink' : '',
        )}
      >
        {label} <ArrowUpDown size={11} />
      </button>
    </th>
  )

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${rows.length} products with reviews in ${scope.range.label.toLowerCase()}`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCSV(
                rows.map((row) => ({
                  product: row.name,
                  category: row.category,
                  reviews: row.reviews,
                  rating: row.rating.toFixed(2),
                  positive_feedback: `${Math.round(row.positive * 100)}%`,
                  private_feedback: row.feedback,
                  scans: row.scans,
                })),
                'reviewdot-products.csv',
              )
            }
          >
            <Download size={15} /> Export CSV
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search products…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search products"
          />
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-5 py-3 font-medium">Product</th>
                {header('reviews', 'Reviews')}
                {header('rating', 'Rating')}
                {header('positive', 'Positive feedback', 'Share of feedback chips that were positive')}
                <th className="px-3 py-3 text-right font-medium">Private feedback</th>
                {header('scans', 'Scans')}
                <th className="px-5 py-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line transition-colors last:border-0 hover:bg-raised">
                  <td className="px-5 py-3.5">
                    <Link to={`/app/products/${row.id}`} className="flex items-center gap-3">
                      <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-raised text-lg">
                        {row.emoji}
                      </span>
                      <span>
                        <span className="block text-[14px] font-medium text-ink">{row.name}</span>
                        <span className="block text-[12px] text-muted">{row.category}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-ink-soft">{row.reviews}</td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center justify-end gap-2">
                      <Stars value={row.rating} size={12} />
                      <span className="text-[14px] font-medium tabular-nums text-ink">{row.rating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-brand-600">
                    {Math.round(row.positive * 100)}%
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-muted">{row.feedback}</td>
                  <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-muted">
                    {formatNumber(row.scans)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[14px] tabular-nums text-muted">
                    {formatCurrency(row.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
