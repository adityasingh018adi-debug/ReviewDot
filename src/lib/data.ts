export type Sentiment = 'positive' | 'neutral' | 'negative'
export type ReviewStatus = 'new' | 'in-progress' | 'responded' | 'escalated'
export type Platform = 'Google' | 'Trustpilot' | 'G2' | 'App Store' | 'Capterra'

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
  product: string
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

export interface Insight {
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

const firstNames = ['Ava', 'Liam', 'Sofia', 'Noah', 'Maya', 'Ethan', 'Zara', 'Kai', 'Priya', 'Marcus', 'Elena', 'Jonas', 'Nina', 'Omar', 'Lucia', 'Felix']
const lastNames = ['Chen', 'Okafor', 'Ramos', 'Novak', 'Patel', 'Kim', 'Costa', 'Berg', 'Ali', 'Moreau', 'Tanaka', 'Weiss', 'Silva', 'Kaur', 'Ross', 'Iversen']

const platforms: Platform[] = ['Google', 'Trustpilot', 'G2', 'App Store', 'Capterra']
const products = ['ReviewDot Core', 'Insights Suite', 'Reply Studio', 'Mobile App', 'API Platform']
const locations = ['San Francisco, US', 'Berlin, DE', 'London, UK', 'Singapore, SG', 'Toronto, CA', 'Sydney, AU', 'Amsterdam, NL', 'Austin, US']

const positiveBodies = [
  'The AI reply suggestions are shockingly good. What used to take our team hours now happens in minutes, and the tone matching is spot on.',
  'Rolled this out across 40 locations. The sentiment dashboards gave us visibility we simply never had before. Support has been stellar too.',
  'Beautiful product. The onboarding was effortless and the insights panel already flagged two issues we had missed for months.',
  'Best-in-class analytics. Our response rate went from 31% to 94% within the first month. The team actually enjoys using it.',
]
const neutralBodies = [
  'Solid platform overall. The dashboard is great, though I would love deeper export options for our quarterly reporting.',
  'Does what it says. Setup took a bit longer than expected because of our SSO configuration, but support walked us through it.',
  'Good value for the price. Some of the integrations feel newer than others — the G2 sync occasionally lags by a few hours.',
]
const negativeBodies = [
  'The mobile experience needs work. Notifications sometimes arrive twice and the review filters reset when I switch tabs.',
  'We hit rate limits on the API tier we purchased and it was not clearly documented. Resolution took three days.',
  'Disappointed with the CSV import — column mapping failed for our legacy data and we had to clean everything manually.',
]

const titlesBySentiment: Record<Sentiment, string[]> = {
  positive: ['Transformed our review workflow', 'Exceptional from day one', 'The AI replies alone are worth it', 'Finally, visibility across every location'],
  neutral: ['Good, with room to grow', 'Solid choice for mid-size teams', 'Does the job well enough'],
  negative: ['Mobile app needs attention', 'Documentation gaps slowed us down', 'Import experience was rough'],
}

const tagPool = ['onboarding', 'ai-replies', 'analytics', 'pricing', 'support', 'mobile', 'integrations', 'performance', 'api', 'reporting']

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260701)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function makeReview(i: number): Review {
  const roll = rand()
  const sentiment: Sentiment = roll < 0.58 ? 'positive' : roll < 0.82 ? 'neutral' : 'negative'
  const rating = sentiment === 'positive' ? 4 + Math.round(rand()) : sentiment === 'neutral' ? 3 : 1 + Math.round(rand())
  const first = pick(firstNames)
  const last = pick(lastNames)
  const body =
    sentiment === 'positive' ? pick(positiveBodies) : sentiment === 'neutral' ? pick(neutralBodies) : pick(negativeBodies)
  const statusRoll = rand()
  const status: ReviewStatus =
    statusRoll < 0.3 ? 'new' : statusRoll < 0.55 ? 'in-progress' : statusRoll < 0.9 ? 'responded' : 'escalated'

  return {
    id: `rev-${i}`,
    author: `${first} ${last}`,
    initials: `${first[0]}${last[0]}`,
    rating,
    platform: pick(platforms),
    sentiment,
    status,
    title: pick(titlesBySentiment[sentiment]),
    body,
    product: pick(products),
    location: pick(locations),
    date: new Date(Date.now() - Math.floor(rand() * 21 * 24 * 3600 * 1000)),
    helpful: Math.floor(rand() * 48),
    aiSummary:
      sentiment === 'positive'
        ? 'Customer praises AI reply quality and time savings. Strong advocate — good expansion candidate.'
        : sentiment === 'neutral'
          ? 'Generally satisfied; requests better exports and faster integration sync. Low churn risk.'
          : 'Frustrated by product friction. Fast, empathetic response recommended within 4 hours.',
    aiReply:
      sentiment === 'positive'
        ? `Thank you so much, ${first}! We're thrilled the AI replies are saving your team real time. Feedback like this is exactly why we build — and there's a lot more coming this quarter.`
        : sentiment === 'neutral'
          ? `Thanks for the thoughtful review, ${first}. Deeper export options are on our near-term roadmap — I'd love to get you early access. Reach out anytime at success@reviewdot.ai.`
          : `${first}, I'm sorry we fell short here — that's not the experience we want for you. Our team has been notified and I'd like to make this right personally. Please email me directly at success@reviewdot.ai.`,
    tags: Array.from(new Set([pick(tagPool), pick(tagPool)])),
    reviewerSince: `${2019 + Math.floor(rand() * 6)}`,
    reviewerCount: 1 + Math.floor(rand() * 30),
  }
}

export const reviews: Review[] = Array.from({ length: 42 }, (_, i) => makeReview(i)).sort(
  (a, b) => b.date.getTime() - a.date.getTime(),
)

export const kpis: KpiSeed[] = [
  { id: 'total', label: 'Total Reviews', value: 24862, delta: 12.4, spark: [32, 38, 35, 44, 48, 46, 58, 61, 57, 69, 74, 82] },
  { id: 'rating', label: 'Average Rating', value: 4.6, decimals: 1, delta: 3.1, spark: [41, 42, 44, 43, 46, 47, 45, 48, 49, 51, 50, 53] },
  { id: 'response', label: 'Response Rate', value: 94.2, suffix: '%', decimals: 1, delta: 8.7, spark: [55, 52, 58, 61, 64, 60, 70, 74, 78, 81, 86, 92] },
  { id: 'sentiment', label: 'Sentiment Score', value: 87, suffix: '/100', delta: 5.2, spark: [48, 51, 47, 55, 58, 62, 60, 66, 71, 74, 79, 84] },
]

export const trendSeries = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  reviews: [1240, 1420, 1380, 1690, 1820, 1760, 2100, 2340, 2280, 2620, 2840, 3120],
  responses: [820, 1050, 1120, 1400, 1580, 1600, 1940, 2210, 2190, 2540, 2790, 3080],
}

export const platformVolumes = [
  { name: 'Google', value: 9840 },
  { name: 'Trustpilot', value: 6210 },
  { name: 'G2', value: 4180 },
  { name: 'App Store', value: 2890 },
  { name: 'Capterra', value: 1742 },
]

export const sentimentSplit = [
  { name: 'Positive', value: 62, tone: 'positive' as const },
  { name: 'Neutral', value: 26, tone: 'neutral' as const },
  { name: 'Negative', value: 12, tone: 'negative' as const },
]

export const regions = [
  { name: 'North America', value: 42, trend: 6.2 },
  { name: 'Europe', value: 31, trend: 9.8 },
  { name: 'Asia Pacific', value: 18, trend: 14.3 },
  { name: 'LATAM', value: 6, trend: 4.1 },
  { name: 'Middle East & Africa', value: 3, trend: 11.7 },
]

export const heatmapData: number[][] = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const business = h >= 8 && h <= 20 ? 0.65 : 0.15
    const weekday = d < 5 ? 1 : 0.55
    return Math.round(rand() * 40 * business * weekday + (h >= 11 && h <= 15 ? 18 : 0) * weekday)
  }),
)

export const insights: Insight[] = [
  {
    id: 'ins-1',
    tone: 'opportunity',
    title: 'AI replies drive a +23% response uplift',
    body: 'Reviews answered with AI-assisted replies convert to follow-up engagement 23% more often. Enabling auto-drafts for the Mobile App queue would cover the largest unanswered segment.',
    confidence: 94,
    action: 'Enable auto-drafts',
  },
  {
    id: 'ins-2',
    tone: 'risk',
    title: 'Mobile complaints trending up 3 weeks straight',
    body: 'Mentions of duplicate notifications rose 41% since the v3.2 release. Sentiment on the App Store cohort dropped 0.4 stars. Escalating to the mobile team is recommended.',
    confidence: 89,
    action: 'Create escalation',
  },
  {
    id: 'ins-3',
    tone: 'trend',
    title: 'APAC review velocity accelerating',
    body: 'Asia-Pacific volume is growing 14.3% month over month — twice the global average. Localizing reply templates for Japanese and Korean would improve response quality scores.',
    confidence: 91,
    action: 'Localize templates',
  },
]

const activitySeeds: Array<[ActivityEvent['kind'], string, string]> = [
  ['review', 'New 5★ review on Google', 'Ava Chen · ReviewDot Core'],
  ['ai', 'AI drafted 12 replies for the morning queue', 'Reply Studio · auto-batch'],
  ['reply', 'Marcus approved and published 4 replies', 'Trustpilot · Reply Studio'],
  ['alert', 'Sentiment dip detected on App Store', 'Mobile App · −0.4★ this week'],
  ['team', 'Elena joined workspace "Global CX"', 'Invited by admin'],
  ['review', 'New 2★ review flagged urgent', 'Trustpilot · API Platform'],
  ['ai', 'Weekly insight digest generated', '3 opportunities · 1 risk'],
  ['reply', 'Auto-reply published after approval window', 'Google · Insights Suite'],
  ['review', 'New 4★ review on G2', 'Priya Patel · Insights Suite'],
  ['alert', 'Response SLA at risk for 3 reviews', 'Escalation queue'],
]

export function seedActivity(): ActivityEvent[] {
  return activitySeeds.map(([kind, text, meta], i) => ({
    id: `act-${i}`,
    kind,
    text,
    meta,
    at: new Date(Date.now() - (i + 1) * 7 * 60 * 1000 - Math.floor(rand() * 240000)),
  }))
}

export function randomActivity(): ActivityEvent {
  const [kind, text, meta] = activitySeeds[Math.floor(Math.random() * activitySeeds.length)]
  return { id: `act-${Date.now()}-${Math.floor(Math.random() * 1e5)}`, kind, text, meta, at: new Date() }
}

export const assistantSuggestions = [
  'Summarize this week’s negative reviews',
  'Draft replies for the escalation queue',
  'Why did App Store sentiment drop?',
  'Compare Google vs Trustpilot this quarter',
]

export function assistantAnswer(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('negative')) {
    return 'This week you received 38 negative reviews (−12% vs last week). Three themes dominate: duplicate mobile notifications (41% of mentions), API rate-limit documentation (22%), and CSV import mapping (15%). I can draft empathetic replies for all 38 and open an escalation for the mobile team — want me to proceed?'
  }
  if (p.includes('draft') || p.includes('replies') || p.includes('escalation')) {
    return 'Done — I drafted 7 replies for the escalation queue, matched to each reviewer’s tone and history. Average sentiment-repair score is 8.6/10. They are staged in Reply Studio awaiting your approval. Two reviews mention refunds, so I flagged those for a human decision.'
  }
  if (p.includes('app store') || p.includes('sentiment drop') || p.includes('drop')) {
    return 'App Store sentiment fell 0.4★ over the past 3 weeks, correlating with the v3.2 release on June 9. 68% of negative mentions cite duplicate push notifications, and 19% cite filter state resetting. Similar issues in your historical data were resolved within one release cycle once escalated — I recommend creating a mobile-team escalation now.'
  }
  if (p.includes('compare') || p.includes('google') || p.includes('trustpilot')) {
    return 'Quarter to date: Google leads with 9,840 reviews at 4.7★ average (response rate 96%), while Trustpilot has 6,210 reviews at 4.4★ (response rate 91%). Trustpilot skews more critical on pricing, but its reviews convert 1.8× more profile visits. Recommendation: shift two weekly reply-hours toward Trustpilot to lift its response rate above 95%.'
  }
  return 'I analyzed your latest review data across all 5 platforms. Overall sentiment is strong at 87/100 (+5.2 this month) and your response rate of 94.2% puts you in the top decile of enterprise workspaces. The single biggest opportunity right now: enabling AI auto-drafts for the Mobile App queue, which would cover 82% of your unanswered reviews. Want me to set that up?'
}
