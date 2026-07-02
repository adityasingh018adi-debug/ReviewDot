import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { assistantAnswer, getDataset } from './data'
import { businessProfile, useBusiness } from './business'

export const AI_MODELS = [
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', hint: 'Most capable — best quality replies' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', hint: 'Fast with near-Opus quality' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', hint: 'Fastest and most cost-effective' },
] as const

export type AiModelId = (typeof AI_MODELS)[number]['id']

interface AiConfigState {
  apiKey: string
  model: AiModelId
  setApiKey: (key: string) => void
  setModel: (model: AiModelId) => void
}

/** BYOK config, persisted locally. The key never leaves the browser except to Anthropic. */
export const useAiConfig = create<AiConfigState>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'claude-opus-4-8',
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setModel: (model) => set({ model }),
    }),
    { name: 'reviewdot-ai-config' },
  ),
)

export function aiIsLive() {
  return useAiConfig.getState().apiKey.length > 0
}

// the SDK is code-split so it only loads once a key is configured
let sdkPromise: Promise<typeof import('@anthropic-ai/sdk')> | null = null

function sdk() {
  return (sdkPromise ??= import('@anthropic-ai/sdk'))
}

async function client() {
  const { default: Anthropic } = await sdk()
  return new Anthropic({
    apiKey: useAiConfig.getState().apiKey,
    dangerouslyAllowBrowser: true,
  })
}

/** Grounding context: the model understands the business type and answers with relevant insight. */
function workspaceContext() {
  const { type, name } = useBusiness.getState()
  const dataset = getDataset(type)
  const profile = businessProfile(type)
  const negative = dataset.reviews.filter((r) => r.sentiment === 'negative').length
  return [
    `You are Aria, the AI assistant inside ReviewDot, an AI business reputation platform. You advise the owner of "${name}", a ${profile.label.toLowerCase()}.`,
    `Give ${profile.label.toLowerCase()}-specific, operational advice — think like a consultant for that industry, not a generic dashboard.`,
    'Be concise, warm, and concrete. Plain prose, no markdown headers. Keep responses under 150 words unless asked for detail.',
    '',
    'Current business snapshot:',
    `- Business type: ${profile.label} · services: ${profile.services.join(', ')}`,
    `- ${dataset.kpis[0].value.toLocaleString()} reviews across Google, Facebook, TripAdvisor, Trustpilot · average rating ${dataset.kpis[1].value}★`,
    `- Response rate ${dataset.kpis[2].value}% · customer satisfaction ${dataset.csat}% · health score ${dataset.health.score} (${dataset.health.grade})`,
    `- Sentiment split: ${dataset.sentimentSplit.map((s) => `${s.name} ${s.value}%`).join(', ')} · ${negative} recent negative reviews`,
    `- Top complaint topics: ${dataset.topComplaints.map((c) => `${c.name} (${c.value})`).join(', ')}`,
    `- Active AI suggestions: ${dataset.actions.map((a) => a.title).join('; ')}`,
  ].join('\n')
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamHandlers {
  onThinking?: () => void
  onText: (delta: string) => void
}

/**
 * Streams an assistant answer. Uses the Claude API when a key is configured,
 * otherwise falls back to the built-in simulation. Returns the full text.
 */
export async function streamAssistantReply(history: ChatTurn[], handlers: StreamHandlers): Promise<string> {
  const last = history[history.length - 1]?.content ?? ''

  if (!aiIsLive()) {
    return simulateStream(assistantAnswer(last, getDataset(useBusiness.getState().type)), handlers)
  }

  const { model } = useAiConfig.getState()
  let full = ''
  const stream = (await client()).messages.stream({
    model,
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: workspaceContext(),
    messages: history.map((t) => ({ role: t.role, content: t.content })),
  })

  for await (const event of stream) {
    if (event.type === 'content_block_start' && event.content_block.type === 'thinking') {
      handlers.onThinking?.()
    }
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      full += event.delta.text
      handlers.onText(event.delta.text)
    }
  }
  await stream.finalMessage()
  return full
}

export const REPLY_TONES = [
  { id: 'professional', label: 'Professional', hint: 'Polished and businesslike' },
  { id: 'friendly', label: 'Friendly', hint: 'Warm and conversational' },
  { id: 'apologetic', label: 'Apologetic', hint: 'Lead with a sincere apology' },
  { id: 'concise', label: 'Concise', hint: 'Two sentences, straight to the point' },
] as const

export type ReplyTone = (typeof REPLY_TONES)[number]['id']

const toneInstructions: Record<ReplyTone, string> = {
  professional: 'Write in a polished, professional voice — courteous and composed.',
  friendly: 'Write in a warm, friendly, conversational voice — like a neighborly owner.',
  apologetic: 'Lead with a sincere, specific apology and take clear ownership before offering a remedy.',
  concise: 'Be extremely concise: two sentences maximum, no filler.',
}

/** Simulation fallback: reshape the canned reply to match the requested tone. */
function simulatedToneReply(
  review: { author: string; aiReply: string; body: string },
  tone: ReplyTone,
): string {
  const first = review.author.split(' ')[0]
  switch (tone) {
    case 'friendly':
      return `Hey ${first}! ${review.aiReply.replace(/^[^—.!]*[.!]\s*/, '')} Thanks a million for taking the time to write this — it honestly keeps us going. See you soon! 😊`
    case 'apologetic':
      return `${first}, first and foremost: we're sincerely sorry. You deserved better, and there's no excuse. We've reviewed exactly what went wrong on our side and taken steps so it doesn't happen again. Please give us a chance to make this right — reach me directly at care@reviewdot.ai.`
    case 'concise':
      return `Thank you for the feedback, ${first} — we've taken it on board and acted on it. We'd love to welcome you back soon.`
    default:
      return review.aiReply
  }
}

/** Streams an AI-drafted reply to a specific review in the requested tone. */
export async function streamReviewReply(
  review: { author: string; platform: string; rating: number; body: string; aiReply: string },
  handlers: StreamHandlers,
  tone: ReplyTone = 'professional',
): Promise<string> {
  if (!aiIsLive()) {
    return simulateStream(simulatedToneReply(review, tone), handlers)
  }

  const { model } = useAiConfig.getState()
  const { type, name } = useBusiness.getState()
  const profile = businessProfile(type)
  const firstName = review.author.split(' ')[0]
  let full = ''
  const stream = (await client()).messages.stream({
    model,
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    system:
      `You write public review replies on behalf of "${name}", a ${profile.label.toLowerCase()}. ` +
      `${toneInstructions[tone]} ` +
      "Address the reviewer's specific points, keep it under 80 words, sign nothing. " +
      'Be genuine — never corporate boilerplate. If the review is negative, offer a direct contact (care@reviewdot.ai).',
    messages: [
      {
        role: 'user',
        content: `Write a reply to this ${review.rating}-star review on ${review.platform} from ${firstName}:\n\n"${review.body}"`,
      },
    ],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_start' && event.content_block.type === 'thinking') {
      handlers.onThinking?.()
    }
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      full += event.delta.text
      handlers.onText(event.delta.text)
    }
  }
  await stream.finalMessage()
  return full
}

/** Verifies the configured key with a minimal request. Returns an error message or null. */
export async function testConnection(): Promise<string | null> {
  const { default: Anthropic } = await sdk()
  try {
    await (
      await client()
    ).messages.create({
      model: useAiConfig.getState().model,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
    })
    return null
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return 'Invalid API key.'
    if (err instanceof Anthropic.RateLimitError) return 'Rate limited — key works, try again shortly.'
    if (err instanceof Anthropic.APIError) return `API error ${err.status}: ${err.message}`
    return err instanceof Error ? err.message : 'Connection failed.'
  }
}

/** Word-chunk fake streaming for the offline simulation. */
function simulateStream(text: string, handlers: StreamHandlers): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => handlers.onThinking?.(), 100)
    let i = 0
    const id = setInterval(() => {
      const next = Math.min(text.length, i + 2 + Math.floor(Math.random() * 4))
      handlers.onText(text.slice(i, next))
      i = next
      if (i >= text.length) {
        clearInterval(id)
        resolve(text)
      }
    }, 14)
  })
}
