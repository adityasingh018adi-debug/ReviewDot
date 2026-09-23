import { dashboardContext } from './dashboard-context.server'
import { scopeFromParams, type ScopeParams } from './scope'
import type { AIContext } from '@/lib/ai'
import { insightsFrom } from './insights'

/**
 * The workspace numbers the analyst answers from.
 *
 * Built here, on the server, from the caller's own rows. It used to arrive in
 * the request body: the endpoint took a `context` object from the browser and
 * interpolated its strings straight into the system prompt, with no session
 * behind it. That is two problems in one — anyone could spend the model budget,
 * and anyone could write into the prompt — and this is the fix for both. The
 * client now sends a question and nothing else.
 */
export async function buildAIContext(params: ScopeParams): Promise<AIContext | null> {
  const context = await dashboardContext()
  if (!context) return null

  const scope = scopeFromParams(params)

  const [stats, outlets, tags, products] = await Promise.all([
    context.repo.overview(scope),
    context.repo.outlets(scope),
    context.repo.tags(scope),
    context.repo.products(scope),
  ])

  return {
    business: context.organizationName ?? 'This workspace',
    range: scope.range.label,
    outlet: scope.outletId
      ? (outlets.find((outlet) => outlet.id === scope.outletId)?.name ?? 'one outlet')
      : 'All outlets',
    scans: stats.scans,
    reviews: stats.reviews,
    rating: stats.rating ?? 0,
    conversion: stats.conversion ?? 0,
    googleClicks: stats.googleClicks,
    topProducts: products.slice(0, 6).map((product) => ({
      name: product.name,
      reviews: product.reviews,
      rating: product.rating ?? 0,
      positive: product.reviews ? product.positive / product.reviews : 0,
    })),
    outlets: outlets.map((outlet) => ({
      name: outlet.name,
      reviews: outlet.reviews,
      rating: outlet.rating ?? 0,
      conversion: outlet.scans ? outlet.reviews / outlet.scans : 0,
    })),
    themes: tags.slice(0, 8).map((tag) => ({ tag: tag.tag, count: tag.mentions })),
    insights: insightsFrom({ stats, outlets, tags, products }),
  }
}
