import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { assistantAnswer, kpis, sentimentSplit, platformVolumes, reviews } from './data'

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

/** Grounding context so the model answers about this workspace's (demo) data. */
function workspaceContext() {
  const negative = reviews.filter((r) => r.sentiment === 'negative').length
  return [
    'You are Aria, the AI assistant inside ReviewDot, an enterprise review-management platform.',
    'Be concise, warm, and concrete. Answer in plain prose (no markdown headers). Keep responses under 150 words unless asked for detail.',
    '',
    'Current workspace snapshot:',
    `- Total reviews: ${kpis[0].value.toLocaleString()} across 5 platforms (Google, Trustpilot, G2, App Store, Capterra)`,
    `- Average rating ${kpis[1].value}★ · response rate ${kpis[2].value}% · sentiment score ${kpis[3].value}/100`,
    `- Sentiment split: ${sentimentSplit.map((s) => `${s.name} ${s.value}%`).join(', ')}`,
    `- Platform volumes: ${platformVolumes.map((p) => `${p.name} ${p.value.toLocaleString()}`).join(', ')}`,
    `- ${negative} recent reviews are negative; top complaint themes: duplicate mobile notifications, API rate-limit documentation, CSV import mapping`,
    '- Known risk: App Store sentiment fell 0.4★ over 3 weeks after the v3.2 release',
    '- Known opportunity: AI-assisted replies drive a +23% response uplift; APAC volume growing 14.3% MoM',
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
    return simulateStream(assistantAnswer(last), handlers)
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

/** Streams an AI-drafted reply to a specific review. */
export async function streamReviewReply(
  review: { author: string; platform: string; rating: number; body: string; aiReply: string },
  handlers: StreamHandlers,
): Promise<string> {
  if (!aiIsLive()) {
    return simulateStream(review.aiReply, handlers)
  }

  const { model } = useAiConfig.getState()
  const firstName = review.author.split(' ')[0]
  let full = ''
  const stream = (await client()).messages.stream({
    model,
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    system:
      'You write public replies to customer reviews on behalf of ReviewDot, a review-management SaaS. ' +
      "Match the reviewer's tone, address their specific points, keep it under 80 words, sign nothing. " +
      'Be genuine — never corporate boilerplate. If the review is negative, apologize concretely and offer a direct contact (success@reviewdot.ai).',
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
