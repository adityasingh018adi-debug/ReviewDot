import type { Destination, DestinationKind, ReviewDestinationService } from './types'

/**
 * Review destinations.
 *
 * The customer always sees every destination the business configured and picks
 * one; nothing here filters by sentiment. Posting itself happens on the external
 * platform, so the only thing recorded is the click-through.
 */

export const DESTINATION_LABELS: Record<DestinationKind, string> = {
  google: 'Google',
  tripadvisor: 'Tripadvisor',
  facebook: 'Facebook',
  instagram: 'Instagram',
  custom: 'Website',
}

export type OutletDestinations = { outletId: string; destinations: Destination[] }

export class LocalReviewDestinationService implements ReviewDestinationService {
  private readonly clicks: { outletId: string; campaignId: string; kind: DestinationKind }[] = []

  constructor(private readonly configured: OutletDestinations[] = []) {}

  async listForOutlet(outletId: string): Promise<Destination[]> {
    return this.configured.find((entry) => entry.outletId === outletId)?.destinations ?? []
  }

  async recordClick(input: {
    outletId: string
    campaignId: string
    draftId?: string
    kind: DestinationKind
  }): Promise<void> {
    this.clicks.push({ outletId: input.outletId, campaignId: input.campaignId, kind: input.kind })
  }

  /** Test seam: what was recorded. */
  get recorded() {
    return [...this.clicks]
  }
}

/** Builds the destination list an outlet exposes, skipping anything unconfigured. */
export function destinationsFrom(outlet: {
  googleReviewUrl?: string | null
  reviewDestinations?: { kind: DestinationKind; url: string; label?: string }[] | null
}): Destination[] {
  const list: Destination[] = []
  if (outlet.googleReviewUrl) {
    list.push({ kind: 'google', label: DESTINATION_LABELS.google, url: outlet.googleReviewUrl })
  }
  for (const extra of outlet.reviewDestinations ?? []) {
    if (!extra.url) continue
    if (list.some((entry) => entry.kind === extra.kind)) continue
    list.push({ kind: extra.kind, label: extra.label ?? DESTINATION_LABELS[extra.kind], url: extra.url })
  }
  return list
}
