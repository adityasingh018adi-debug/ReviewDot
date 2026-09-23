import type { InsightCard } from '@/lib/insights'
import type { OutletRow, OverviewStats, ProductRow, TagRow } from './dashboard'

/**
 * Insights from a workspace's real aggregates.
 *
 * Deliberately deterministic: every card states a number that came out of the
 * database and says where it came from. The AI assistant is a separate thing —
 * it answers questions *about* these figures and is told never to invent any.
 * Generating the cards themselves with a model would mean a business reading
 * invented findings about its own customers, which is the failure this whole
 * rebuild exists to avoid.
 *
 * A card only appears when there is enough behind it to mean something, so a
 * quiet week produces fewer cards rather than weaker ones.
 */

export type InsightInput = {
  stats: OverviewStats
  outlets: OutletRow[]
  tags: TagRow[]
  products: ProductRow[]
}

/** Below this, a difference is noise and a card would be over-reading it. */
const MIN_SAMPLE = 5

export function insightsFrom({ stats, outlets, tags, products }: InsightInput): InsightCard[] {
  const cards: InsightCard[] = []

  // Conversion: the number the product exists to move.
  if (stats.scans >= MIN_SAMPLE && stats.conversion !== null) {
    const pct = Math.round(stats.conversion * 100)
    cards.push({
      id: 'conversion',
      kind: stats.conversion >= 0.2 ? 'trend' : 'opportunity',
      title:
        stats.conversion >= 0.2
          ? `${pct}% of scans became feedback`
          : `Only ${pct}% of scans became feedback`,
      detail:
        stats.conversion >= 0.2
          ? 'People who scan are finishing. Adding codes where you have none is the fastest way to grow from here.'
          : 'Most people scanned and stopped. That usually means the code sits somewhere they are already leaving.',
      metric: `${stats.scans} scans · ${stats.reviews} pieces of feedback`,
      action: stats.conversion >= 0.2 ? 'Add codes to more tables' : 'Move a code to where people wait',
      href: '/app/campaigns',
    })
  }

  // The complaint that keeps coming up.
  const worstTag = tags
    .filter((tag) => tag.mentions >= MIN_SAMPLE && tag.avgRating !== null)
    .sort((a, b) => (a.avgRating ?? 5) - (b.avgRating ?? 5))[0]

  if (worstTag && (worstTag.avgRating ?? 5) < 4) {
    cards.push({
      id: `tag-${worstTag.tag}`,
      kind: 'risk',
      title: `“${worstTag.tag}” comes with your lowest ratings`,
      detail: `Feedback mentioning ${worstTag.tag.toLowerCase()} averages ${worstTag.avgRating?.toFixed(1)}★, below your overall ${stats.rating?.toFixed(1) ?? '—'}★.`,
      metric: `${worstTag.mentions} mentions · ${worstTag.avgRating?.toFixed(1)}★`,
      action: 'Read what they said',
      href: '/app/feedback?max=3',
    })
  }

  // An outlet pulling away from the others, in either direction.
  const rated = outlets.filter((outlet) => outlet.reviews >= MIN_SAMPLE && outlet.rating !== null)
  if (rated.length >= 2) {
    const sorted = [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    const best = sorted[0]!
    const worst = sorted[sorted.length - 1]!
    if ((best.rating ?? 0) - (worst.rating ?? 0) >= 0.4) {
      cards.push({
        id: 'outlet-gap',
        kind: 'opportunity',
        title: `${best.name} is rated ${((best.rating ?? 0) - (worst.rating ?? 0)).toFixed(1)}★ above ${worst.name}`,
        detail: `Both are collecting feedback, so the gap is about the visit rather than the sample. Whatever ${best.name} is doing is worth copying.`,
        metric: `${best.name} ${best.rating?.toFixed(1)}★ · ${worst.name} ${worst.rating?.toFixed(1)}★`,
        action: 'Compare outlets',
        href: '/app/analytics',
      })
    }
  }

  // The product people actually talk about.
  const topProduct = products.filter((product) => product.reviews >= MIN_SAMPLE)[0]
  if (topProduct) {
    cards.push({
      id: `product-${topProduct.id}`,
      kind: 'trend',
      title: `${topProduct.name} is what customers mention most`,
      detail: `It appears in more feedback than anything else you sell${
        topProduct.rating === null ? '' : `, averaging ${topProduct.rating.toFixed(1)}★`
      }.`,
      metric: `${topProduct.reviews} pieces of feedback`,
      action: 'See product feedback',
      href: '/app/products',
    })
  }

  // Feedback that reached a platform.
  if (stats.reviews >= MIN_SAMPLE) {
    const share = stats.googleClicks / stats.reviews
    cards.push({
      id: 'posting',
      kind: share >= 0.5 ? 'trend' : 'opportunity',
      title: `${Math.round(share * 100)}% of people went on to post publicly`,
      detail:
        share >= 0.5
          ? 'Customers are willing to post once the words are already written for them.'
          : 'Most kept it private. That is their choice to make, and the private feedback is still yours to act on.',
      metric: `${stats.googleClicks} of ${stats.reviews}`,
      action: 'Open the review inbox',
      href: '/app/inbox',
    })
  }

  return cards
}
