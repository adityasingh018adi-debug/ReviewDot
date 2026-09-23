import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/rate-limit'
import { checkLimit, retryAfterSeconds } from '@/services/rate-limit.server'
import { LocalAIReviewService, groundingIssues } from '@/services/ai-review'
import { ClaudeReviewService } from '@/services/ai-review.server'
import { firstIssue, reviewDraftSchema } from '@/lib/schemas'

/**
 * Drafts a review from a customer's own feedback.
 *
 * Server-side on purpose: the Anthropic key stays in the server environment and
 * never reaches the browser. Without a key the deterministic local adapter
 * answers instead, so the flow always works.
 */

export const runtime = 'nodejs'

/**
 * Keyed on the address, because a customer scanning a code has no account.
 * Generous for the same reason the scan limit is: a whole café shares one.
 */
const LIMIT = { max: 12, windowSeconds: 60 }

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  const verdict = await checkLimit(`ai-review:${ip}`, LIMIT.max, LIMIT.windowSeconds)
  if (!verdict.ok) {
    return NextResponse.json(
      { error: 'Too many requests, please retry shortly.' },
      { status: 429, headers: { 'retry-after': String(retryAfterSeconds(verdict)) } },
    )
  }

  const parsed = reviewDraftSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
  }
  const input = parsed.data

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
