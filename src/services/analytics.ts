import type { AnalyticsEvent, AnalyticsService } from './types'

/**
 * Analytics.
 *
 * Events are product telemetry (scan, feedback submitted, draft approved,
 * destination clicked), not customer identity. Nothing here records personal
 * data; the scan page passes an anonymous visitor hash at most.
 */
export class LocalAnalyticsService implements AnalyticsService {
  private readonly events: AnalyticsEvent[] = []

  async track(event: AnalyticsEvent): Promise<void> {
    this.events.push(event)
  }

  get recorded() {
    return [...this.events]
  }
}

/** Fans out to several sinks, ignoring individual failures. */
export class CompositeAnalyticsService implements AnalyticsService {
  constructor(private readonly sinks: AnalyticsService[]) {}

  async track(event: AnalyticsEvent): Promise<void> {
    await Promise.allSettled(this.sinks.map((sink) => sink.track(event)))
  }
}

export const ANALYTICS_EVENTS = {
  scan: 'qr.scanned',
  feedbackSubmitted: 'feedback.submitted',
  draftGenerated: 'ai_draft.generated',
  draftEdited: 'ai_draft.edited',
  draftApproved: 'ai_draft.approved',
  destinationClicked: 'review.destination_clicked',
} as const
