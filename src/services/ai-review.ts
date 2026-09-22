import type { AIReviewService, ReviewDraft, ReviewDraftInput } from './types'

/**
 * AI review writing — browser-safe half.
 *
 * The product promise is assistance, not invention: a draft may only restate
 * what the customer already said, which `groundingIssues` enforces.
 *
 * This module must never import a provider SDK: it is reachable from client
 * components, so an import here would ship the SDK — and invite a key — into
 * the browser bundle. The model-backed adapter lives in ai-review.server.ts.
 */

/** Numbers, money and superlatives a customer did not write are not ours to add. */
const CLAIM_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'a price or amount', pattern: /(?:₹|rs\.?|\$|€|£)\s?\d+|\b\d+\s?(?:rupees|dollars|euros)\b/gi },
  { label: 'a rating', pattern: /\b\d(?:\.\d)?\s?(?:\/\s?5|stars?|star rating)\b/gi },
  { label: 'a visit count', pattern: /\b(?:first|second|third|\d+(?:st|nd|rd|th))\s+(?:time|visit)\b/gi },
  { label: 'a wait time', pattern: /\b\d+\s?(?:min(?:ute)?s?|hours?)\b/gi },
  { label: 'a named person', pattern: /\bserved by [A-Z][a-z]+\b/g },
]

/**
 * Claims present in the draft but absent from what the customer wrote.
 * An empty array means the draft stays within the customer's own account.
 */
export function groundingIssues(source: string, draft: string): string[] {
  const haystack = source.toLowerCase()
  const issues = new Set<string>()

  for (const { label, pattern } of CLAIM_PATTERNS) {
    for (const match of draft.matchAll(pattern)) {
      if (!haystack.includes(match[0].toLowerCase())) issues.add(label)
    }
  }

  // any digit sequence in the draft must appear in the source too
  for (const match of draft.matchAll(/\b\d+\b/g)) {
    if (!haystack.includes(match[0])) issues.add(`the number ${match[0]}`)
  }

  return [...issues]
}

const SYSTEM_PROMPT = `You rewrite a customer's own feedback into a short, natural public review.

Rules, without exception:
- Use only what the customer said. Never add facts, prices, wait times, staff names,
  dishes, visit counts, ratings or comparisons they did not mention.
- Never invent enthusiasm the customer did not express. Match their sentiment.
- Write in first person, 2-4 sentences, plain language, no marketing copy.
- No hashtags, no emoji, no star ratings in the text.
- Return only the review text.`

function buildUserPrompt(input: ReviewDraftInput): string {
  return [
    `Business: ${input.businessName}`,
    `Outlet: ${input.outletName}`,
    input.productName ? `Product: ${input.productName}` : null,
    `Rating the customer gave: ${input.rating} out of 5`,
    input.tags.length ? `What they highlighted: ${input.tags.join(', ')}` : null,
    '',
    'What the customer wrote:',
    `"""${input.comment}"""`,
    '',
    `Tone: ${input.tone ?? 'natural'}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/* ------------------------------------------------------------------ */

/**
 * Deterministic adapter used when no model is configured. It only reshapes the
 * customer's sentences and their selected chips — it cannot introduce content,
 * which is why it is safe as a fallback rather than a stand-in for a model.
 */
export class LocalAIReviewService implements AIReviewService {
  async draftReview(input: ReviewDraftInput): Promise<ReviewDraft> {
    const sentences = input.comment
      .split(/(?<=[.!?])\s+|\n+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`))
      .map((part) => part[0].toUpperCase() + part.slice(1))

    const opener = input.productName
      ? `Had a good experience at ${input.businessName} in ${input.outletName}, and the ${input.productName} stood out.`
      : `Had a good experience at ${input.businessName} in ${input.outletName}.`

    const highlights = input.tags.length
      ? `What stood out: ${formatList(input.tags.map((tag) => tag.toLowerCase()))}.`
      : ''

    const body = sentences.join(' ')
    const text = [input.rating >= 4 ? opener : '', body, highlights]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    return { text, offline: true, ungrounded: groundingIssues(input.comment, text) }
  }
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export { SYSTEM_PROMPT as REVIEW_SYSTEM_PROMPT, buildUserPrompt as buildReviewPrompt }
