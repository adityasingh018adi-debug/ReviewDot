import { ISSUE_TAGS, business as businessRecord, isPositiveTag, outletById, outlets, productById, products } from './data'

const businessName = businessRecord.name
import type { DataSet, Scope } from './metrics'
import { byOutlet, byProduct, entriesIn, overview, ratingTrend, tagFrequency } from './metrics'
import type { Entry } from './types'
import { average, formatPercent, formatTrend } from './utils'

/* ------------------------------------------------------------------ *
 * Keyword mining — the "AI" layer reads the same data the charts do,
 * so every claim on the insights pages is traceable to real reviews.
 * ------------------------------------------------------------------ */

const STOP_WORDS = new Set(
  `a an and the was were is are it its it's we i they he she of for to in on at with but very really
   this that these those our my your their had has have been be so too much more most just quite
   there here from as about than then also all any some no not nor did do does done while when what
   which who whom you me us them will would can could should shall may might must said say says
   got get went came arrived tasted felt seemed looked one two three back again still even though
   thing things bit lot nothing something anything everything okay ok fine good great nice`
    .split(/\s+/)
    .filter(Boolean),
)

/**
 * Product, outlet and business names dominate any word count and say nothing
 * about the experience, so they are excluded from mined keywords.
 */
function nameWords(): Set<string> {
  const words = new Set<string>()
  for (const label of [businessName, ...products.map((p) => p.name), ...outlets.map((o) => o.name), ...outlets.map((o) => o.city)]) {
    for (const word of label.toLowerCase().split(/[^a-z]+/)) {
      if (word.length > 2) words.add(word)
    }
  }
  return words
}

const NAME_WORDS = nameWords()

export type Keyword = { phrase: string; count: number; share: number }

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word) && !NAME_WORDS.has(word))
}

/** Unigrams plus adjacent bigrams, so "wait time" beats "wait" + "time". */
function phrasesOf(text: string): string[] {
  const words = tokenize(text)
  const phrases = [...words]
  for (let i = 0; i < words.length - 1; i++) phrases.push(`${words[i]} ${words[i + 1]}`)
  return phrases
}

function rank(list: Entry[], limit: number): Keyword[] {
  const counts = new Map<string, number>()
  for (const entry of list) {
    const seen = new Set<string>()
    for (const phrase of phrasesOf(entry.comment)) {
      if (seen.has(phrase)) continue
      seen.add(phrase)
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1)
    }
  }
  // drop unigrams that only ever appear inside a stronger bigram
  const entriesList = [...counts.entries()]
  const filtered = entriesList.filter(([phrase, count]) => {
    if (phrase.includes(' ')) return count > 1
    const strongerPair = entriesList.find(([other, otherCount]) => {
      return other.includes(' ') && other.split(' ').includes(phrase) && otherCount >= count
    })
    return !strongerPair && count > 1
  })
  const total = filtered.reduce((sum, [, count]) => sum + count, 0) || 1
  return filtered
    .map(([phrase, count]) => ({ phrase, count, share: count / total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function positiveKeywords(list: Entry[], limit = 6): Keyword[] {
  return rank(
    list.filter((entry) => entry.rating >= 4 && !entry.tags.some((tag) => !isPositiveTag(tag))),
    limit,
  )
}

export function negativeKeywords(list: Entry[], limit = 6): Keyword[] {
  return rank(
    list.filter((entry) => entry.rating <= 3),
    limit,
  )
}

/* ------------------------------------------------------------------ *
 * Summaries
 * ------------------------------------------------------------------ */

export type ProductSummary = {
  productId: string
  name: string
  reviews: number
  rating: number
  headline: string
  loved: string[]
  improve: string[]
  actions: string[]
  momentum: 'rising' | 'steady' | 'slipping'
  confidence: 'high' | 'medium' | 'low'
}

function titleCase(phrase: string): string {
  return phrase.replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

export function productSummary(productId: string, scope: Scope, data?: DataSet): ProductSummary {
  const product = productById(productId)
  const list = entriesIn({ ...scope, productId }, data)
  const rating = average(list.map((entry) => entry.rating))
  const loved = positiveKeywords(list, 4).map((k) => titleCase(k.phrase))
  const issueTags = tagFrequency(list, 12)
    .filter((tag) => !isPositiveTag(tag.tag))
    .slice(0, 3)
    .map((tag) => tag.tag)
  const improve = issueTags.length ? issueTags : negativeKeywords(list, 3).map((k) => titleCase(k.phrase))

  const trendPoints = ratingTrend(list, 4).filter((point) => point.value > 0)
  const first = trendPoints[0]?.value ?? rating
  const last = trendPoints[trendPoints.length - 1]?.value ?? rating
  const delta = last - first
  const momentum = delta > 0.12 ? 'rising' : delta < -0.12 ? 'slipping' : 'steady'
  const confidence = list.length >= 40 ? 'high' : list.length >= 15 ? 'medium' : 'low'

  const share = list.length ? list.filter((entry) => entry.rating === 5).length / list.length : 0
  const headline = product
    ? `${list.length} customers rated ${product.name} in this period, averaging ${rating.toFixed(1)}★ with ${formatPercent(share, 0)} rating it five stars.`
    : 'No reviews in this period.'

  const actions: string[] = []
  if (improve.length) {
    actions.push(`Brief outlet teams on "${improve[0].toLowerCase()}" — it is the most repeated improvement note.`)
  }
  if (momentum === 'slipping') actions.push('Run a recipe and plating check; the rating trend has moved down this period.')
  if (momentum === 'rising' && product) actions.push(`Feature ${product.name} on table QR cards while sentiment is climbing.`)
  if (loved.length) actions.push(`Use "${loved[0].toLowerCase()}" in menu copy and campaign creative — customers say it most.`)

  return {
    productId,
    name: product?.name ?? 'Unknown product',
    reviews: list.length,
    rating,
    headline,
    loved,
    improve,
    actions: actions.slice(0, 3),
    momentum,
    confidence,
  }
}

/* ------------------------------------------------------------------ *
 * Business-level insight cards
 * ------------------------------------------------------------------ */

export type InsightCard = {
  id: string
  kind: 'opportunity' | 'risk' | 'trend'
  title: string
  detail: string
  metric: string
  action: string
  href?: string
}

export function businessInsights(scope: Scope, data?: DataSet): InsightCard[] {
  const stats = overview(scope, data)
  const list = entriesIn(scope, data)
  const productStats = byProduct(scope, data)
  const outletStats = byOutlet(scope, data)
  const cards: InsightCard[] = []

  const topProduct = productStats[0]
  if (topProduct) {
    cards.push({
      id: 'top-product',
      kind: 'opportunity',
      title: `${topProduct.name} is your review engine`,
      detail: `It generated ${topProduct.reviews} of ${list.length} reviews at ${topProduct.rating.toFixed(1)}★. Putting its QR on packaging and the bill would compound that.`,
      metric: `${formatPercent(topProduct.reviews / (list.length || 1), 0)} of all reviews`,
      action: 'Open product',
      href: `/app/products/${topProduct.id}`,
    })
  }

  const weakest = [...productStats].filter((p) => p.reviews >= 8).sort((a, b) => a.rating - b.rating)[0]
  if (weakest) {
    cards.push({
      id: 'weak-product',
      kind: 'risk',
      title: `${weakest.name} is dragging the average`,
      detail: `${weakest.rating.toFixed(1)}★ across ${weakest.reviews} reviews, with ${weakest.feedback} pieces of private feedback attached to it.`,
      metric: `${formatPercent(1 - weakest.positive, 0)} of its feedback flags an issue`,
      action: 'Review feedback',
      href: `/app/products/${weakest.id}`,
    })
  }

  const laggingOutlet = [...outletStats].sort((a, b) => a.conversion - b.conversion)[0]
  const leadingOutlet = [...outletStats].sort((a, b) => b.conversion - a.conversion)[0]
  if (laggingOutlet && leadingOutlet && laggingOutlet.id !== leadingOutlet.id) {
    cards.push({
      id: 'conversion-gap',
      kind: 'trend',
      title: `${leadingOutlet.name} converts scans ${Math.round((leadingOutlet.conversion / (laggingOutlet.conversion || 1) - 1) * 100)}% better than ${laggingOutlet.name}`,
      detail: `${leadingOutlet.name} turns ${formatPercent(leadingOutlet.conversion, 1)} of scans into reviews versus ${formatPercent(laggingOutlet.conversion, 1)} at ${laggingOutlet.name}. Table placement and staff prompts are the usual difference.`,
      metric: `${formatTrend(stats.trends.conversion)} conversion overall`,
      action: 'Compare outlets',
      href: '/app/outlets',
    })
  }

  const issues = tagFrequency(list, 12).filter((tag) => !isPositiveTag(tag.tag))
  if (issues.length) {
    cards.push({
      id: 'top-issue',
      kind: 'risk',
      title: `"${issues[0].tag}" is the most reported problem`,
      detail: `Mentioned ${issues[0].count} times this period${issues[1] ? `, ahead of "${issues[1].tag}" (${issues[1].count})` : ''}. Fixing it lifts the ratings that never reach Google.`,
      metric: `${issues[0].count} mentions`,
      action: 'Open feedback',
      href: '/app/feedback',
    })
  }

  cards.push({
    id: 'review-velocity',
    kind: stats.trends.reviews >= 0 ? 'trend' : 'risk',
    title: `Review velocity is ${stats.trends.reviews >= 0 ? 'up' : 'down'} ${formatTrend(Math.abs(stats.trends.reviews))} period over period`,
    detail: `${stats.reviews} reviews from ${stats.scans} scans, a ${formatPercent(stats.conversion, 1)} conversion rate. ${stats.googleClicks} customers continued to a public review platform.`,
    metric: `${formatPercent(stats.conversion, 1)} scan → review`,
    action: 'Open analytics',
    href: '/app/analytics',
  })

  return cards
}

/* ------------------------------------------------------------------ *
 * Feedback theme clustering for the AI Insights page
 * ------------------------------------------------------------------ */

export type Theme = {
  tag: string
  count: number
  share: number
  rating: number
  outlets: { name: string; count: number }[]
  sample: string
}

export function feedbackThemes(scope: Scope, data?: DataSet, limit = 5): Theme[] {
  const list = entriesIn(scope, data)
  return (ISSUE_TAGS as readonly string[])
    .map((tag) => {
      const tagged = list.filter((entry) => entry.tags.includes(tag))
      const byOutletCount = new Map<string, number>()
      for (const entry of tagged) {
        const name = outletById(entry.outletId)?.name ?? 'Unknown'
        byOutletCount.set(name, (byOutletCount.get(name) ?? 0) + 1)
      }
      return {
        tag,
        count: tagged.length,
        share: list.length ? tagged.length / list.length : 0,
        rating: average(tagged.map((entry) => entry.rating)),
        outlets: [...byOutletCount.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        sample: tagged.find((entry) => entry.comment)?.comment ?? '',
      }
    })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
