import Anthropic from '@anthropic-ai/sdk'
import {
  CAPTION_SYSTEM_PROMPT,
  LocalAIReviewService,
  REVIEW_SYSTEM_PROMPT,
  buildReviewPrompt,
  groundingIssues,
} from './ai-review'
import type { AIReviewService, ReviewDraft, ReviewDraftInput } from './types'

/**
 * Model-backed review drafting. Server-only.
 *
 * Importing this from a client component would pull the Anthropic SDK into the
 * browser bundle, so the constructor refuses to run there. API routes and
 * server actions are the only callers.
 */
export class ClaudeReviewService implements AIReviewService {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'claude-sonnet-5',
    private readonly fallback: AIReviewService = new LocalAIReviewService(),
  ) {
    if (typeof window !== 'undefined') {
      throw new Error('ClaudeReviewService is server-only — it must never run in the browser')
    }
  }

  async draftReview(input: ReviewDraftInput): Promise<ReviewDraft> {
    try {
      const client = new Anthropic({ apiKey: this.apiKey })
      const caption = input.format === 'caption'
      const message = await client.messages.create({
        model: this.model,
        max_tokens: caption ? 150 : 400,
        system: caption ? CAPTION_SYSTEM_PROMPT : REVIEW_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildReviewPrompt(input) }],
      })

      const text = message.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim()

      const ungrounded = groundingIssues(input.comment, text)
      // a draft that invents facts is discarded rather than shown to a customer
      if (!text || ungrounded.length) return this.fallback.draftReview(input)

      return { text, offline: false, model: this.model, ungrounded: [] }
    } catch {
      return this.fallback.draftReview(input)
    }
  }
}
