import type { InsightCard } from './insights'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** Everything the assistant is allowed to reason about, rendered as plain text. */
export type AIContext = {
  business: string
  range: string
  outlet: string
  scans: number
  reviews: number
  rating: number
  conversion: number
  googleClicks: number
  topProducts: { name: string; reviews: number; rating: number; positive: number }[]
  outlets: { name: string; reviews: number; rating: number; conversion: number }[]
  themes: { tag: string; count: number }[]
  insights: InsightCard[]
}

export function contextToPrompt(context: AIContext): string {
  const lines = [
    `Business: ${context.business}`,
    `Outlet filter: ${context.outlet}`,
    `Period: ${context.range}`,
    `QR scans: ${context.scans}`,
    `Reviews collected: ${context.reviews}`,
    `Average rating: ${context.rating.toFixed(2)}`,
    `Scan-to-review conversion: ${(context.conversion * 100).toFixed(1)}%`,
    `Clicks through to public review platforms: ${context.googleClicks}`,
    '',
    'Products:',
    ...context.topProducts.map(
      (p) => `- ${p.name}: ${p.reviews} reviews, ${p.rating.toFixed(1)}★, ${Math.round(p.positive * 100)}% positive feedback`,
    ),
    '',
    'Outlets:',
    ...context.outlets.map(
      (o) => `- ${o.name}: ${o.reviews} reviews, ${o.rating.toFixed(1)}★, ${(o.conversion * 100).toFixed(1)}% conversion`,
    ),
    '',
    'Most reported issues:',
    ...context.themes.map((t) => `- ${t.tag}: ${t.count} mentions`),
  ]
  return lines.join('\n')
}

/* ------------------------------------------------------------------ *
 * Offline analyst.
 *
 * Answers from workspace numbers alone, with no network call. The assistant
 * asks /api/ai/assistant first; this is what replies when no model is
 * configured or the route is unreachable. Model access lives server-side —
 * nothing here may import a provider SDK, or the key would ship to browsers.
 * ------------------------------------------------------------------ */

type Rule = { match: RegExp; answer: (context: AIContext) => string }

const RULES: Rule[] = [
  {
    match: /best|top|popular|winner|most review/i,
    answer: (c) => {
      const top = c.topProducts[0]
      if (!top) return 'No product has enough reviews in this period yet.'
      return `${top.name} leads with ${top.reviews} reviews at ${top.rating.toFixed(1)}★ and ${Math.round(top.positive * 100)}% positive feedback. It alone accounts for ${Math.round((top.reviews / Math.max(1, c.reviews)) * 100)}% of everything collected this period. Put its QR on packaging and the bill footer to compound that.`
    },
  },
  {
    match: /worst|weak|problem|improve|issue|complain|negative|hurt|drag|fix|wrong|risk/i,
    answer: (c) => {
      const weakest = [...c.topProducts].sort((a, b) => a.rating - b.rating)[0]
      const theme = c.themes[0]
      return `${weakest ? `${weakest.name} is the weakest performer at ${weakest.rating.toFixed(1)}★ across ${weakest.reviews} reviews. ` : ''}${theme ? `"${theme.tag}" is the most reported issue with ${theme.count} mentions. ` : ''}Brief outlet managers on it at this week's shift handover and re-check the trend in seven days.`
    },
  },
  {
    match: /conversion|scan|funnel/i,
    answer: (c) => {
      const best = [...c.outlets].sort((a, b) => b.conversion - a.conversion)[0]
      const worst = [...c.outlets].sort((a, b) => a.conversion - b.conversion)[0]
      return `${c.scans} scans produced ${c.reviews} reviews — a ${(c.conversion * 100).toFixed(1)}% conversion rate. ${best && worst ? `${best.name} converts at ${(best.conversion * 100).toFixed(1)}% versus ${(worst.conversion * 100).toFixed(1)}% at ${worst.name}.` : ''} Copy the table-tent placement and staff prompt from the stronger outlet.`
    },
  },
  {
    match: /outlet|location|branch|store/i,
    answer: (c) =>
      c.outlets
        .map((o) => `${o.name}: ${o.reviews} reviews, ${o.rating.toFixed(1)}★, ${(o.conversion * 100).toFixed(1)}% conversion`)
        .join('. ') + '.',
  },
  {
    match: /google|public|reputation/i,
    answer: (c) =>
      `${c.googleClicks} customers continued to a public review platform this period — ${Math.round((c.googleClicks / Math.max(1, c.reviews)) * 100)}% of everyone who rated. Customers who select a low rating are routed to private feedback instead, which is why your public rating stays honest.`,
  },
  {
    match: /rating|score|star/i,
    answer: (c) =>
      `Average rating is ${c.rating.toFixed(2)}★ across ${c.reviews} reviews. ${c.topProducts.slice(0, 3).map((p) => `${p.name} ${p.rating.toFixed(1)}★`).join(', ')}.`,
  },
]

export function localAnswer(question: string, context: AIContext): string {
  const rule = RULES.find((r) => r.match.test(question))
  if (rule) return rule.answer(context)
  const insight = context.insights[0]
  return insight
    ? `${insight.title}. ${insight.detail}`
    : `I can answer questions about products, outlets, conversion and reported issues for ${context.business} in this period.`
}
