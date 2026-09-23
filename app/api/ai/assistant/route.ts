import { NextResponse } from 'next/server'
import { contextToPrompt, localAnswer } from '@/lib/ai'
import { buildAIContext } from '@/services/ai-context.server'
import { getWorkspaceSession } from '@/services/auth.server'
import { isSupabaseConfigured } from '@/services/supabase'
import { checkLimit, retryAfterSeconds } from '@/services/rate-limit.server'
import { assistantSchema, firstIssue } from '@/lib/schemas'

/**
 * The workspace analyst.
 *
 * Two things changed here, and both were holes rather than features.
 *
 * It required no session, so anyone who found the URL could spend the model
 * budget. It now resolves the caller first and refuses without one.
 *
 * And it took the workspace numbers from the request body, interpolating the
 * caller's strings straight into the *system* prompt — a direct injection
 * channel, in front of no authentication. The context is now built on the
 * server from the caller's own rows; the client sends a question and a
 * conversation, and nothing it sends reaches the system prompt.
 */

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are ReviewDot's customer-experience analyst for a multi-outlet business.
Answer only from the data provided. Be specific and quantitative, name products and outlets, and finish
with one concrete action the team can take this week. Keep replies under 120 words. Never invent numbers.`

/** Per signed-in user rather than per address: the budget is theirs to spend. */
const LIMIT = { max: 20, windowSeconds: 60 }

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'The analyst is not available on this deployment.' }, { status: 503 })
  }

  const workspace = await getWorkspaceSession()
  if (!workspace?.active) {
    return NextResponse.json({ error: 'Sign in to use the analyst.' }, { status: 401 })
  }

  const verdict = await checkLimit(`assistant:${workspace.user.id}`, LIMIT.max, LIMIT.windowSeconds)
  if (!verdict.ok) {
    return NextResponse.json(
      { error: 'Too many questions at once. Give it a moment.' },
      { status: 429, headers: { 'retry-after': String(retryAfterSeconds(verdict)) } },
    )
  }

  const parsed = assistantSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
  }
  const { question, scope, history } = parsed.data

  // The scope narrows which of the caller's own rows are summarised. It cannot
  // widen them: scopeFromParams validates it, and every read underneath is
  // filtered by row level security regardless of what arrives here.
  const context = await buildAIContext(scope)
  if (!context) return NextResponse.json({ error: 'No workspace found.' }, { status: 404 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ text: localAnswer(question, context), offline: true })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 700,
      system: `${SYSTEM_PROMPT}\n\nWorkspace data:\n${contextToPrompt(context)}`,
      messages: [...history.slice(-6), { role: 'user' as const, content: question }],
    })
    const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('').trim()
    return NextResponse.json({ text: text || localAnswer(question, context), offline: !text })
  } catch {
    return NextResponse.json({ text: localAnswer(question, context), offline: true })
  }
}
