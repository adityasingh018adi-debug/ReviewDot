import type { Metadata } from 'next'
import { ProductsLive } from '@/views/app/ProductsLive'
import { dashboardContext } from '@/services/dashboard-context.server'
import { scopeFromParams, type ScopeParams } from '@/services/scope'

export const metadata: Metadata = { title: 'Products' }

/**
 * One view for both modes. Demo differs only in which repository answers, so
 * the seeded figures stay exact and there is no second copy of this page to
 * drift away from the one real customers see.
 */
export default async function Page({ searchParams }: { searchParams: Promise<ScopeParams> }) {
  const context = await dashboardContext()
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
