export type QRType = 'outlet' | 'table' | 'product' | 'packaging' | 'bill' | 'campaign'
export type QRStatus = 'active' | 'paused' | 'archived'
export type Destination = 'google' | 'instagram' | 'custom'
export type EntryKind = 'review' | 'feedback'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type FeedbackStatus = 'new' | 'in-progress' | 'resolved'

export type Business = {
  id: string
  name: string
  mark: string
  category: string
  city: string
  plan: 'Starter' | 'Growth' | 'Scale'
}

export type Outlet = {
  id: string
  businessId: string
  name: string
  city: string
  address: string
  manager: string
  tables: number
  googlePlace: string
}

export type Product = {
  id: string
  businessId: string
  name: string
  category: string
  price: number
  emoji: string
  /** Demo targets the generated review set reproduces exactly. */
  target: { reviews: number; rating: number; positive: number }
}

export type QRCodeRecord = {
  id: string
  /** The unguessable /r/{code} segment. Never derived from anything readable. */
  code: string
  /** Human-readable label printed on collateral, e.g. RD-LL-TH-T04. Never used for lookups. */
  reference?: string
  label: string
  type: QRType
  businessId: string
  outletId: string
  productId?: string
  location?: string
  campaign?: string
  destination: Destination
  destinationUrl: string
  status: QRStatus
  createdAt: string
}

export type Entry = {
  id: string
  kind: EntryKind
  businessId: string
  outletId: string
  productId: string
  qrId: string
  rating: number
  tags: string[]
  comment: string
  customerId?: string
  createdAt: string
  /** Clicked through to a public review destination (reviews only). */
  publicClick: boolean
  destination?: Destination
  status: FeedbackStatus
  reply?: string
}

export type Customer = {
  id: string
  name: string
  initials: string
  contact: string
  visits: number
  lastSeen: string
  outletId: string
  avgRating: number
}

export type Campaign = {
  id: string
  name: string
  goal: string
  channel: string
  status: 'live' | 'scheduled' | 'ended'
  startedAt: string
  qrIds: string[]
  scans: number
  reviews: number
}

export type ScanPoint = { date: string; scans: number; reviews: number }
