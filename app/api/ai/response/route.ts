import { NextResponse } from 'next/server'
import { getWorkspaceSession } from '@/services/auth.server'
import { AuthUnavailableError } from '@/lib/auth-outcome'
import { isSupabaseConfigured } from '@/services/supabase'
import { checkLimit, retryAfterSeconds } from '@/services/rate-limit.server'
import { firstIssue, responseDraftSchema } from '@/lib/schemas'
import type { ResponseInput } from '@/services/types'

/**
 * Drafts a business reply to a piece of feedback, for owners and managers.
 * Server-side for the same reason as the review route: the key stays here.
 */

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You write short replies from a business to a customer's feedback.
Acknowledge what they actually said, never invent policies, compensation, names or facts,
never dispute their experience, and close with one concrete next step when the feedback is
critical. Two to four sentences. Return only the reply.`

/** Deterministic reply used when no model is configured. */
function localReply(input: ResponseInput): string {
  const positive = input.rating >= 4
  const opener = positive
    ? `Thank you for taking the time to share this.`
    : `Thank you for sharing this, and we're sorry your visit fell short.`
  const middle = positive
    ? `We're glad the experience at ${input.outletName} worked for you.`
    : `We've passed your note to the team at ${input.outletName} so they can look into it.`
  const close = positive
    ? `We hope to see you again soon.`
    : `We'd like to put it right on your next visit.`
  return [opener, middle, close].join(' ')
}

const LIMIT = { max: 20, windowSeconds: 60 }

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Not available on this deployment.' }, { status: 503 })
  }

  // Three answers, not two. A session that cannot be read is not a signed-out
  // one, and answering 401 would tell the browser to send this person back to
  // the sign-in screen they already passed.
  let workspace: Awaited<ReturnType<typeof getWorkspaceSession>>
  try {
    workspace = await getWorkspaceSession()
  } catch (error) {
    if (error instanceof AuthUnavailableError) {
      return NextResponse.json(
        { error: 'We could not verify your session just now. Please try again.' },
        { status: 503, headers: { 'retry-after': '5' } },
      )
    }
    throw error
  }

  if (!workspace?.active) {
    return NextResponse.json({ error: 'Sign in to draft a reply.' }, { status: 401 })
  }

  const verdict = await checkLimit(`ai-response:${workspace.user.id}`, LIMIT.max, LIMIT.windowSeconds)
  if (!verdict.ok) {
    return NextResponse.json(
      { error: 'Too many requests, please retry shortly.' },
      { status: 429, headers: { 'retry-after': String(retryAfterSeconds(verdict)) } },
    )
  }

  const parsed = responseDraftSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
  }
  const input: ResponseInput = parsed.data

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ text: localReply(input), offline: true })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      system: `${SYSTEM_PROMPT}\nTone: ${input.tone}.`,
      messages: [
        {
          role: 'user',
          content: `Business: ${input.businessName}\nOutlet: ${input.outletName}\nRating: ${input.rating}/5\nFeedback: """${input.feedback}"""`,
        },
      ],
    })
    const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('').trim()
    return NextResponse.json({ text: text || localReply(input), offline: !text })
  } catch {
    return NextResponse.json({ text: localReply(input), offline: true })
  }
}
