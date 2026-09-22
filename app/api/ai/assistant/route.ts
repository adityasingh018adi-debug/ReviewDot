import { NextResponse } from 'next/server'
import { contextToPrompt, localAnswer, type AIContext, type ChatMessage } from '@/lib/ai'

/**
 * The workspace analyst.
 *
 * Runs server-side so the Anthropic key never reaches a browser bundle. Without
 * a key it answers from the same workspace numbers using the built-in analyst,
 * so the feature degrades rather than disappears.
 */

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are ReviewDot's customer-experience analyst for a multi-outlet business.
Answer only from the data provided. Be specific and quantitative, name products and outlets, and finish
with one concrete action the team can take this week. Keep replies under 120 words. Never invent numbers.`

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    question?: string
    context?: AIContext
    history?: ChatMessage[]
  } | null

  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, 1000) : ''
  const context = body?.context
  if (!question || !context) {
    return NextResponse.json({ error: 'A question and workspace context are required.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ text: localAnswer(question, context), offline: true })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const history = (body?.history ?? []).slice(-6).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 2000),
    }))
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 700,
      system: `${SYSTEM_PROMPT}\n\nWorkspace data:\n${contextToPrompt(context)}`,
      messages: [...history, { role: 'user' as const, content: question }],
    })
    const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('').trim()
    return NextResponse.json({ text: text || localAnswer(question, context), offline: !text })
  } catch {
    return NextResponse.json({ text: localAnswer(question, context), offline: true })
  }
}
