import { NextResponse } from 'next/server'
import { LocalAIReviewService, groundingIssues } from '@/services/ai-review'
import { ClaudeReviewService } from '@/services/ai-review.server'
import type { ReviewDraftInput } from '@/services/types'

/**
 * Drafts a review from a customer's own feedback.
 *
 * Server-side on purpose: the Anthropic key stays in the server environment and
 * never reaches the browser. Without a key the deterministic local adapter
 * answers instead, so the flow always works.
 */

export const runtime = 'nodejs'

const MAX_COMMENT = 2000
const MAX_TAGS = 12

/** Crude per-instance limiter — enough to blunt scripted abuse of the endpoint. */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 12
const hits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > MAX_PER_WINDOW
}

function parse(body: unknown): ReviewDraftInput | null {
  if (!body || typeof body !== 'object') return null
  const input = body as Record<string, unknown>
  const comment = typeof input.comment === 'string' ? input.comment.trim().slice(0, MAX_COMMENT) : ''
  const rating = Number(input.rating)
  if (!comment || !Number.isInteger(rating) || rating < 1 || rating > 5) return null

  return {
    comment,
    rating,
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, MAX_TAGS)
      : [],
    businessName: String(input.businessName ?? '').slice(0, 120),
    outletName: String(input.outletName ?? '').slice(0, 120),
    productName: input.productName ? String(input.productName).slice(0, 120) : undefined,
    tone: input.tone === 'warm' || input.tone === 'concise' || input.tone === 'detailed' ? input.tone : 'natural',
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests, please retry shortly.' }, { status: 429 })
  }

  const input = parse(await request.json().catch(() => null))
  if (!input) {
    return NextResponse.json({ error: 'A comment and a rating between 1 and 5 are required.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const service = apiKey ? new ClaudeReviewService(apiKey) : new LocalAIReviewService()
  const draft = await service.draftReview(input)

  // belt and braces: never return a draft that adds claims the customer did not make
  if (groundingIssues(input.comment, draft.text).length) {
    const safe = await new LocalAIReviewService().draftReview(input)
    return NextResponse.json({ ...safe, fellBack: true })
  }

  return NextResponse.json(draft)
}
