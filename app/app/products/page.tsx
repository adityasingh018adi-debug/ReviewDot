import type { Metadata } from 'next'
import { Products } from '@/views/app/Products'
import { ProductsLive } from '@/views/app/ProductsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Products' }

export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
  if (context.mode !== 'live') return <Products />

  const scope = scopeFromParams(await searchParams)
  const [products, outlets] = await Promise.all([
    context.repo.products(scope),
    context.repo.outletOptions(),
  ])

  return (
    <ProductsLive
      products={products}
      outlets={outlets}
      rangeLabel={scope.range.label}
      canManage={context.can('product:manage')}
    />
  )
}
