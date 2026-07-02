import { businessProfile, useBusiness, type BusinessType } from './business'

export type Sentiment = 'positive' | 'neutral' | 'negative'
export type ReviewStatus = 'open' | 'replied' | 'closed'
export type Platform = 'Google' | 'Facebook' | 'TripAdvisor' | 'Trustpilot'

export const PLATFORMS: Platform[] = ['Google', 'Facebook', 'TripAdvisor', 'Trustpilot']

export interface Review {
  id: string
  author: string
  initials: string
  rating: number
  platform: Platform
  sentiment: Sentiment
  status: ReviewStatus
  title: string
  body: string
  service: string
  location: string
  date: Date
  helpful: number
  aiSummary: string
  aiReply: string
  tags: string[]
  reviewerSince: string
  reviewerCount: number
}

export interface ActivityEvent {
  id: string
  kind: 'review' | 'reply' | 'ai' | 'alert' | 'team'
  text: string
  meta: string
  at: Date
}

export interface ActionSuggestion {
  id: string
  tone: 'opportunity' | 'risk' | 'trend'
  title: string
  body: string
  confidence: number
  action: string
}

export interface KpiSeed {
  id: string
  label: string
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  delta: number
  spark: number[]
}

export interface HealthFactor {
  label: string
  score: number
  detail: string
}

export interface Dataset {
  type: BusinessType
  reviews: Review[]
  kpis: KpiSeed[]
  trendSeries: { labels: string[]; reviews: number[]; responses: number[] }
  ratingTrend: number[]
  platformVolumes: Array<{ name: string; value: number }>
  sentimentSplit: Array<{ name: string; value: number }>
  topComplaints: Array<{ name: string; value: number }>
  csat: number
  health: { score: number; grade: string; factors: HealthFactor[] }
  actions: ActionSuggestion[]
  activitySeeds: Array<[ActivityEvent['kind'], string, string]>
  suggestions: string[]
}

const firstNames = [
  'Ava',
  'Liam',
  'Sofia',
  'Noah',
  'Maya',
  'Ethan',
  'Zara',
  'Kai',
  'Priya',
  'Marcus',
  'Elena',
  'Jonas',
  'Nina',
  'Omar',
  'Lucia',
  'Felix',
]
const lastNames = [
  'Chen',
  'Okafor',
  'Ramos',
  'Novak',
  'Patel',
  'Kim',
  'Costa',
  'Berg',
  'Ali',
  'Moreau',
  'Tanaka',
  'Weiss',
  'Silva',
  'Kaur',
  'Ross',
  'Iversen',
]
const locations = [
  'Downtown',
  'Riverside',
  'Old Town',
  'Midtown',
  'Harbor District',
  'Westside',
  'Uptown',
  'Garden Quarter',
]

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildDataset(type: BusinessType): Dataset {
  const profile = businessProfile(type)
  const rand = mulberry32(type.length * 7919 + 20260701)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]

  const reviews: Review[] = Array.from({ length: 42 }, (_, i) => {
    const roll = rand()
    const sentiment: Sentiment = roll < 0.58 ? 'positive' : roll < 0.82 ? 'neutral' : 'negative'
    const rating =
      sentiment === 'positive' ? 4 + Math.round(rand()) : sentiment === 'neutral' ? 3 : 1 + Math.round(rand())
    const first = pick(firstNames)
    const last = pick(lastNames)
    const statusRoll = rand()
    const status: ReviewStatus = statusRoll < 0.35 ? 'open' : statusRoll < 0.8 ? 'replied' : 'closed'
    const topicA = pick(profile.topics)
    const topicB = pick(profile.topics)
    const service = pick(profile.services)

    return {
      id: `rev-${type}-${i}`,
      author: `${first} ${last}`,
      initials: `${first[0]}${last[0]}`,
      rating,
      platform: pick(PLATFORMS),
      sentiment,
      status,
      title: pick(profile.titles[sentiment]),
      body: pick(profile.bodies[sentiment]),
      service,
      location: pick(locations),
      date: new Date(Date.now() - Math.floor(rand() * 21 * 24 * 3600 * 1000)),
      helpful: Math.floor(rand() * 48),
      aiSummary:
        sentiment === 'positive'
          ? `Delighted customer praising ${topicA.replace(/-/g, ' ')} — strong advocate. A short thank-you reply reinforces loyalty.`
          : sentiment === 'neutral'
            ? `Satisfied overall with a fixable concern about ${topicA.replace(/-/g, ' ')}. Low churn risk; acknowledge and note the improvement.`
            : `Frustrated by ${topicA.replace(/-/g, ' ')}. Respond within 4 hours with a concrete fix and a direct contact to recover trust.`,
      aiReply:
        sentiment === 'positive'
          ? `Thank you so much, ${first}! Hearing this made our team's day — we've shared your words with everyone involved. We can't wait to welcome you back.`
          : sentiment === 'neutral'
            ? `Thanks for the honest feedback, ${first}. You're right about the ${topicA.replace(/-/g, ' ')} — we're actively working on it, and we'd love the chance to show you the improvement soon.`
            : `${first}, I'm truly sorry about your experience — this isn't the standard we hold ourselves to. I'd like to make it right personally: please reach us at care@reviewdot.ai and ask for the manager on duty.`,
      tags: Array.from(new Set([topicA, topicB])),
      reviewerSince: `${2019 + Math.floor(rand() * 6)}`,
      reviewerCount: 1 + Math.floor(rand() * 30),
    }
  }).sort((a, b) => b.date.getTime() - a.date.getTime())

  const fourPlus = reviews.filter((r) => r.rating >= 4).length
  const csat = Math.round((fourPlus / reviews.length) * 100)

  const complaintCounts = new Map<string, number>()
  for (const r of reviews) {
    if (r.sentiment !== 'negative' && !(r.sentiment === 'neutral' && r.rating <= 3)) continue
    for (const t of r.tags) complaintCounts.set(t, (complaintCounts.get(t) ?? 0) + 1)
  }
  const topComplaints = [...complaintCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name: name.replace(/-/g, ' '), value }))

  const kpis: KpiSeed[] = [
    {
      id: 'total',
      label: 'Total Reviews',
      value: 1862,
      delta: 12.4,
      spark: [32, 38, 35, 44, 48, 46, 58, 61, 57, 69, 74, 82],
    },
    {
      id: 'rating',
      label: 'Average Rating',
      value: 4.6,
      decimals: 1,
      delta: 3.1,
      spark: [41, 42, 44, 43, 46, 47, 45, 48, 49, 51, 50, 53],
    },
    {
      id: 'response',
      label: 'Response Rate',
      value: 94.2,
      suffix: '%',
      decimals: 1,
      delta: 8.7,
      spark: [55, 52, 58, 61, 64, 60, 70, 74, 78, 81, 86, 92],
    },
    {
      id: 'csat',
      label: 'Customer Satisfaction',
      value: csat,
      suffix: '%',
      delta: 5.2,
      spark: [48, 51, 47, 55, 58, 62, 60, 66, 71, 74, 79, 84],
    },
  ]

  const health = {
    score: 87,
    grade: 'A',
    factors: [
      {
        label: 'Average rating',
        score: 92,
        detail: '4.6★ across all platforms — top quartile for your industry',
      },
      { label: 'Response coverage', score: 94, detail: '94% of reviews get a reply, most within a day' },
      { label: 'Sentiment momentum', score: 84, detail: 'Positive share up 5 points over the last 30 days' },
      { label: 'Review velocity', score: 78, detail: 'New reviews growing 12% month over month' },
    ],
  }

  const actions: ActionSuggestion[] = profile.actions.map((a, i) => ({ id: `act-${type}-${i}`, ...a }))

  const activitySeeds: Array<[ActivityEvent['kind'], string, string]> = [
    [
      'review',
      'New 5★ review on Google',
      `${pick(firstNames)} ${pick(lastNames)} · ${pick(profile.services)}`,
    ],
    ['ai', 'AI drafted 8 replies for the morning queue', 'Awaiting your approval'],
    ['reply', 'Marcus approved and published 4 replies', 'Google · Facebook'],
    [
      'alert',
      `Negative review flagged: ${topComplaints[0]?.name ?? 'service'}`,
      'Respond within SLA · 3h left',
    ],
    ['team', 'Elena joined your team as Manager', 'Invited by owner'],
    ['review', 'New 2★ review flagged urgent', `TripAdvisor · ${pick(profile.services)}`],
    ['ai', 'Weekly business health report generated', `Health score ${health.score} (${health.grade})`],
    ['reply', 'Reply published after approval', `Trustpilot · ${pick(profile.services)}`],
    ['alert', 'Response SLA at risk for 2 reviews', 'Open queue'],
  ]

  return {
    type,
    reviews,
    kpis,
    trendSeries: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      reviews: [84, 96, 92, 118, 126, 122, 148, 163, 158, 181, 196, 214],
      responses: [58, 74, 79, 98, 110, 112, 136, 154, 152, 176, 192, 211],
    },
    ratingTrend: [4.31, 4.35, 4.33, 4.4, 4.42, 4.45, 4.44, 4.5, 4.52, 4.55, 4.58, 4.6],
    platformVolumes: [
      { name: 'Google', value: 842 },
      { name: 'Facebook', value: 431 },
      { name: 'TripAdvisor', value: 334 },
      { name: 'Trustpilot', value: 255 },
    ],
    sentimentSplit: [
      { name: 'Positive', value: 62 },
      { name: 'Neutral', value: 26 },
      { name: 'Negative', value: 12 },
    ],
    topComplaints,
    csat,
    health,
    actions,
    activitySeeds,
    suggestions: [
      'Summarize this week’s reviews',
      'What are customers complaining about most?',
      'How is my business health score calculated?',
      'Draft replies for all open negative reviews',
    ],
  }
}

const datasets = new Map<BusinessType, Dataset>()

export function getDataset(type: BusinessType): Dataset {
  let d = datasets.get(type)
  if (!d) {
    d = buildDataset(type)
    datasets.set(type, d)
  }
  return d
}

/** Reactive dataset for the currently selected business type. */
export function useDataset(): Dataset {
  const type = useBusiness((s) => s.type)
  return getDataset(type)
}

let activityCounter = 0

export function seedActivity(dataset: Dataset): ActivityEvent[] {
  return dataset.activitySeeds.map(([kind, text, meta], i) => ({
    id: `act-seed-${i}`,
    kind,
    text,
    meta,
    at: new Date(Date.now() - (i + 1) * 7 * 60 * 1000),
  }))
}

export function randomActivity(dataset: Dataset): ActivityEvent {
  const [kind, text, meta] = dataset.activitySeeds[Math.floor(Math.random() * dataset.activitySeeds.length)]
  return { id: `act-live-${++activityCounter}`, kind, text, meta, at: new Date() }
}

/** Simulated Aria answers, grounded in the active business dataset. */
export function assistantAnswer(prompt: string, dataset: Dataset): string {
  const p = prompt.toLowerCase()
  const profile = businessProfile(dataset.type)
  const top = dataset.topComplaints[0]?.name ?? 'service speed'
  const second = dataset.topComplaints[1]?.name ?? 'pricing'

  if (p.includes('summar')) {
    return `This week your ${profile.label.toLowerCase()} received 47 reviews averaging 4.6★. Customers loved your ${profile.services[0].toLowerCase()} and frequently praised the staff. The main friction points were ${top} (${dataset.topComplaints[0]?.value ?? 4} mentions) and ${second}. Your response rate held at 94%, and satisfaction sits at ${dataset.csat}%. Overall: a strong week with one theme worth acting on — want me to draft an action plan for ${top}?`
  }
  if (p.includes('complain')) {
    return `Your top complaint topics right now: ${dataset.topComplaints
      .slice(0, 3)
      .map((c, i) => `${i + 1}) ${c.name} (${c.value} mentions)`)
      .join(
        ', ',
      )}. The good news: all three are operational, not quality issues — they respond quickly to process fixes. The suggested action "${dataset.actions[0].action}" in your dashboard targets the biggest one directly.`
  }
  if (p.includes('health')) {
    return `Your business health score is ${dataset.health.score} (grade ${dataset.health.grade}). It blends four signals: average rating (${dataset.health.factors[0].score}), response coverage (${dataset.health.factors[1].score}), sentiment momentum (${dataset.health.factors[2].score}), and review velocity (${dataset.health.factors[3].score}). Your weakest lever is review velocity — asking happy customers for reviews at the point of service is the fastest way to raise it.`
  }
  if (p.includes('draft') || p.includes('repl')) {
    return `Done — I drafted replies for all ${dataset.reviews.filter((r) => r.status === 'open' && r.sentiment === 'negative').length} open negative reviews, each addressing the specific complaint and offering a direct contact. They're staged on the Reviews page awaiting your approval. Two mention refunds, so I flagged those for your decision first.`
  }
  return `Here's where your ${profile.label.toLowerCase()} stands: 4.6★ average across Google, Facebook, TripAdvisor and Trustpilot, ${dataset.csat}% customer satisfaction, and a health score of ${dataset.health.score}. Review volume is growing 12% month over month. Your single biggest opportunity: acting on ${top}, which drives most of your negative feedback. Want the step-by-step plan?`
}
