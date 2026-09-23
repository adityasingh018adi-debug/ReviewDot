import { z } from 'zod'

/**
 * Request shapes for the API routes.
 *
 * Deliberately only here. Server actions take flat form data through a `field()`
 * helper that already trims and type-checks it, and wrapping that in a schema
 * would be ceremony rather than safety. These three payloads are nested — an
 * array of tags, a conversation, a scope object — and nested is where hand-rolled
 * parsing quietly stops checking.
 *
 * Every string is bounded. A length cap is not a formality on an endpoint that
 * forwards its input to a model and pays by the token.
 */

const bounded = (max: number) => z.string().trim().max(max)

export const reviewDraftSchema = z.object({
  comment: bounded(2000).min(1, 'Tell us what happened.'),
  rating: z.coerce.number().int().min(1).max(5),
  tags: z.array(bounded(60)).max(12).default([]),
  businessName: bounded(120).default(''),
  outletName: bounded(120).default(''),
  productName: bounded(120).optional(),
  tone: z.enum(['natural', 'warm', 'concise', 'detailed']).default('natural'),
})

export const responseDraftSchema = z.object({
  feedback: bounded(2000).min(1),
  rating: z.coerce.number().int().min(1).max(5),
  businessName: bounded(120).default(''),
  outletName: bounded(120).default(''),
  tone: z.enum(['professional', 'friendly', 'warm', 'concise']).default('professional'),
})

/**
 * The analyst takes a question and the filters the page is showing. It does not
 * take the workspace numbers — those are the server's to assemble — so there is
 * no place in this schema for them, which is the point.
 */
export const assistantSchema = z.object({
  question: bounded(1000).min(1, 'Ask a question.'),
  scope: z
    .object({
      range: bounded(20).optional(),
      outlet: bounded(64).optional(),
      from: bounded(10).optional(),
      to: bounded(10).optional(),
    })
    .default({}),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: bounded(2000),
      }),
    )
    .max(20)
    .default([]),
})

export type ReviewDraftPayload = z.infer<typeof reviewDraftSchema>
export type ResponseDraftPayload = z.infer<typeof responseDraftSchema>
export type AssistantPayload = z.infer<typeof assistantSchema>

/** First message only: a caller needs to know what to fix, not the whole tree. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'That request was not valid.'
}
