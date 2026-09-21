import type {
  Business,
  Campaign,
  Customer,
  Destination,
  Entry,
  Outlet,
  Product,
  QRCodeRecord,
  QRStatus,
  QRType,
  ScanPoint,
} from './types'

/* ------------------------------------------------------------------ *
 * Deterministic pseudo-randomness — the demo data must be stable
 * across renders, reloads and tests.
 * ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260920)
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]
const between = (min: number, max: number) => min + rand() * (max - min)
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1))

const DAY = 86_400_000
const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

/** ISO timestamp `daysAgo` days back, at a plausible hour of the day. */
function timestamp(daysAgo: number): string {
  const hour = pick([9, 11, 12, 13, 13, 14, 16, 18, 19, 20, 20, 21, 21, 22])
  const d = new Date(TODAY.getTime() - daysAgo * DAY)
  d.setHours(hour, intBetween(0, 59), intBetween(0, 59), 0)
  return d.toISOString()
}

export const dayKey = (iso: string) => iso.slice(0, 10)

/* ------------------------------------------------------------------ *
 * Business, outlets, products
 * ------------------------------------------------------------------ */

export const business: Business = {
  id: 'biz-love-latte',
  name: 'Love & Latte',
  mark: 'L&',
  category: 'Café & Patisserie',
  city: 'Mumbai Metropolitan Region',
  plan: 'Growth',
}

export const outlets: Outlet[] = [
  {
    id: 'out-thane',
    businessId: business.id,
    name: 'Thane',
    city: 'Thane West',
    address: 'Shop 4, Hiranandani Estate, Thane West 400607',
    manager: 'Nikita Rane',
    tables: 12,
    googlePlace: 'Love & Latte · Thane West',
  },
  {
    id: 'out-bandra',
    businessId: business.id,
    name: 'Bandra',
    city: 'Bandra West',
    address: '22 Pali Naka, Bandra West, Mumbai 400050',
    manager: 'Arjun Mehta',
    tables: 8,
    googlePlace: 'Love & Latte · Bandra West',
  },
  {
    id: 'out-lower-parel',
    businessId: business.id,
    name: 'Lower Parel',
    city: 'Lower Parel',
    address: 'Unit 9, Kamala Mills, Lower Parel, Mumbai 400013',
    manager: 'Sara Dsouza',
    tables: 10,
    googlePlace: 'Love & Latte · Lower Parel',
  },
]

/**
 * Product targets are the demo numbers shown across the product table —
 * the generated review set reproduces each one exactly.
 */
export const products: Product[] = [
  {
    id: 'prd-mango-cheesecake',
    businessId: business.id,
    name: 'Mango Cheesecake',
    category: 'Desserts',
    price: 380,
    emoji: '🥭',
    target: { reviews: 86, rating: 4.9, positive: 0.91 },
  },
  {
    id: 'prd-tiramisu',
    businessId: business.id,
    name: 'Tiramisu',
    category: 'Desserts',
    price: 420,
    emoji: '🍰',
    target: { reviews: 72, rating: 4.8, positive: 0.89 },
  },
  {
    id: 'prd-caesar-salad',
    businessId: business.id,
    name: 'Caesar Salad',
    category: 'Mains',
    price: 340,
    emoji: '🥗',
    target: { reviews: 54, rating: 4.6, positive: 0.84 },
  },
  {
    id: 'prd-croissant',
    businessId: business.id,
    name: 'Croissant',
    category: 'Bakery',
    price: 180,
    emoji: '🥐',
    target: { reviews: 43, rating: 4.5, positive: 0.81 },
  },
  {
    id: 'prd-cold-brew',
    businessId: business.id,
    name: 'Cold Brew',
    category: 'Coffee',
    price: 260,
    emoji: '🧊',
    target: { reviews: 24, rating: 4.7, positive: 0.87 },
  },
  {
    id: 'prd-blueberry-muffin',
    businessId: business.id,
    name: 'Blueberry Muffin',
    category: 'Bakery',
    price: 210,
    emoji: '🫐',
    target: { reviews: 16, rating: 4.4, positive: 0.75 },
  },
  {
    id: 'prd-avocado-toast',
    businessId: business.id,
    name: 'Avocado Toast',
    category: 'Mains',
    price: 390,
    emoji: '🥑',
    target: { reviews: 13, rating: 4.3, positive: 0.69 },
  },
  {
    id: 'prd-cappuccino',
    businessId: business.id,
    name: 'Cappuccino',
    category: 'Coffee',
    price: 220,
    emoji: '☕',
    target: { reviews: 8, rating: 4.8, positive: 0.88 },
  },
  {
    id: 'prd-penne-arrabbiata',
    businessId: business.id,
    name: 'Penne Arrabbiata',
    category: 'Mains',
    price: 460,
    emoji: '🍝',
    target: { reviews: 6, rating: 4.2, positive: 0.67 },
  },
  {
    id: 'prd-chocolate-brownie',
    businessId: business.id,
    name: 'Chocolate Brownie',
    category: 'Desserts',
    price: 240,
    emoji: '🍫',
    target: { reviews: 4, rating: 4.5, positive: 0.75 },
  },
]

export const productById = (id: string) => products.find((p) => p.id === id)
export const outletById = (id: string) => outlets.find((o) => o.id === id)

/* ------------------------------------------------------------------ *
 * Feedback vocabulary — chips the customer picks, plus comment phrases
 * the AI layer mines for keywords.
 * ------------------------------------------------------------------ */

export const POSITIVE_TAGS = ['Taste', 'Freshness', 'Presentation', 'Portion Size', 'Value for Money'] as const
export const SERVICE_TAGS = ['Friendly Staff', 'Quick Service', 'Ambience', 'Cleanliness'] as const
/** Issue chips stay disjoint from the positive vocabulary so shares stay countable. */
export const ISSUE_TAGS = [
  'Too Sweet',
  'Long Wait',
  'Small Portion',
  'Served Cold',
  'Pricing',
  'Staff Attention',
  'Table Not Cleared',
] as const

const POSITIVE_PHRASES = [
  'The {product} was absolutely fresh and the mango flavour really came through.',
  'Loved the creamy texture of the {product} — easily the best in {city}.',
  'Beautiful presentation on the {product}, and the staff were genuinely warm.',
  'Perfectly balanced sweetness in the {product}. Coming back this weekend.',
  '{product} arrived quickly and tasted fresh. Great value for the portion.',
  'The {product} is consistently good at the {outlet} outlet. Lovely ambience too.',
  'Fresh ingredients, creamy texture, and a really good portion size.',
  'Staff recommended the {product} and they were right — brilliant flavour.',
]

const NEUTRAL_PHRASES = [
  'The {product} was good but slightly sweeter than I expected.',
  'Decent {product}, though the portion size felt small for the price.',
  'Tasted fine, but we waited a while for the {product} to arrive.',
  'The {product} was okay — nothing wrong, nothing memorable.',
  'Good flavour on the {product}, but it was served a little warm.',
]

const NEGATIVE_PHRASES = [
  'The {product} was too sweet for us and the base was soggy.',
  'We waited almost 25 minutes for the {product} — the table was not cleared either.',
  'Portion size of the {product} has shrunk while the price went up.',
  'The {product} was served cold and nobody checked on our table.',
  'Very long wait time at {outlet} and the {product} arrived melted.',
]

/* ------------------------------------------------------------------ *
 * Customers
 * ------------------------------------------------------------------ */

const FIRST_NAMES = [
  'Aditi','Rohan','Meera','Kabir','Ishita','Dev','Ananya','Vikram','Sneha','Arjun',
  'Priya','Nikhil','Tara','Aryan','Rhea','Kunal','Diya','Farhan','Sana','Vivek',
  'Neha','Omkar','Zoya','Raghav','Maya','Siddharth','Kiara','Aman','Nisha','Yash',
]
const LAST_NAMES = [
  'Shah','Iyer','Kulkarni','Menon','Desai','Bhatt','Nair','Rane','Kapoor','Fernandes',
  'Joshi','Pillai','Sheikh','Chauhan','Dutta','Verma','Reddy','Malhotra','Gokhale','Dsouza',
]

function buildCustomers(): Customer[] {
  const list: Customer[] = []
  for (let i = 0; i < 180; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const visits = rand() < 0.62 ? 1 : intBetween(2, 9)
    list.push({
      id: `cus-${i.toString().padStart(3, '0')}`,
      name: `${first} ${last}`,
      initials: `${first[0]}${last[0]}`,
      contact: rand() < 0.55 ? `+91 ${intBetween(70, 99)}${intBetween(10000000, 99999999)}` : `${first.toLowerCase()}.${last.toLowerCase()}@mail.com`,
      visits,
      lastSeen: timestamp(intBetween(0, 45)),
      outletId: pick(outlets).id,
      avgRating: Number(between(3.6, 5).toFixed(1)),
    })
  }
  return list
}

export const customers = buildCustomers()

/* ------------------------------------------------------------------ *
 * QR codes
 * ------------------------------------------------------------------ */

function shortCode(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(rand() * alphabet.length)]
  return out
}

function buildQRCodes(): QRCodeRecord[] {
  const list: QRCodeRecord[] = []
  const push = (
    type: QRType,
    outlet: Outlet,
    label: string,
    extra: Partial<QRCodeRecord> = {},
    status: QRStatus = 'active',
  ) => {
    const code = shortCode()
    list.push({
      id: `qr-${code}`,
      code,
      label,
      type,
      businessId: business.id,
      outletId: outlet.id,
      destination: 'google',
      destinationUrl: `https://g.page/r/${outlet.name.toLowerCase().replace(/\s+/g, '-')}/review`,
      status,
      createdAt: timestamp(intBetween(35, 150)),
      ...extra,
    })
  }

  for (const outlet of outlets) {
    push('outlet', outlet, `${outlet.name} — Entrance standee`, { location: 'Entrance' })
    for (let t = 1; t <= outlet.tables; t++) {
      push(
        'table',
        outlet,
        `${outlet.name} — Table ${t.toString().padStart(2, '0')}`,
        { location: `Table ${t.toString().padStart(2, '0')}` },
        t % 11 === 0 ? 'paused' : 'active',
      )
    }
    push('bill', outlet, `${outlet.name} — Bill footer`, { location: 'Bill / receipt' })
    push('packaging', outlet, `${outlet.name} — Takeaway sleeve`, { location: 'Packaging' })
  }

  // product-level codes live at the flagship outlet
  const flagship = outlets[0]
  for (const product of products.slice(0, 6)) {
    push('product', flagship, `${product.name} — Counter card`, {
      productId: product.id,
      location: 'Dessert counter',
    })
  }

  push('campaign', outlets[1], 'Monsoon Menu — Instagram story', {
    campaign: 'Monsoon Menu 2026',
    destination: 'instagram',
    destinationUrl: 'https://instagram.com/loveandlatte',
  })
  push('campaign', outlets[2], 'Weekend Brunch — Flyer drop', {
    campaign: 'Weekend Brunch',
    destination: 'custom',
    destinationUrl: 'https://loveandlatte.in/brunch',
  })
  push(
    'campaign',
    outlets[0],
    'Diwali Hampers — Packaging insert',
    { campaign: 'Diwali Hampers', destination: 'custom', destinationUrl: 'https://loveandlatte.in/hampers' },
    'archived',
  )

  return list
}

export const qrCodes = buildQRCodes()

/** The QR used by the public demo experience (`/r/:code`). */
export const demoQR =
  qrCodes.find((q) => q.type === 'table' && q.location === 'Table 12' && q.outletId === 'out-thane') ??
  qrCodes[0]

/* ------------------------------------------------------------------ *
 * Reviews & feedback
 * ------------------------------------------------------------------ */

const POSITIVE_POOL: readonly string[] = [...POSITIVE_TAGS, ...SERVICE_TAGS]

export function isPositiveTag(tag: string): boolean {
  return POSITIVE_POOL.includes(tag)
}

/** Drop sizes cycled through when lowering 5★ ratings — mostly 4★, rarely 1★. */
const DROP_CYCLE = [1, 1, 1, 2, 1, 2, 3, 1, 1, 4]

/**
 * Build `count` ratings whose mean rounds to `mean`, shaped like a real review
 * distribution: a long 5★ head, a shoulder of 4★ and a thin tail below.
 */
export function ratingSpread(count: number, mean: number): number[] {
  const ratings = new Array<number>(count).fill(5)
  let deficit = 5 * count - Math.round(mean * count)
  for (let i = 0; i < count && deficit > 0; i++) {
    const drop = Math.min(DROP_CYCLE[i % DROP_CYCLE.length], deficit, 4)
    ratings[i] = 5 - drop
    deficit -= drop
  }
  // a very low mean needs more than one pass over the list
  for (let guard = 0; deficit > 0 && guard < count * 4; guard++) {
    const index = guard % count
    if (ratings[index] > 1) {
      ratings[index] -= 1
      deficit -= 1
    }
  }
  return ratings
}

function sampleTags(pool: readonly string[], count: number, taken: string[] = []): string[] {
  const chosen = new Set(taken)
  const before = chosen.size
  let guard = 0
  while (chosen.size - before < count && guard++ < 40) chosen.add(pick(pool))
  return [...chosen].slice(before)
}

/**
 * Attach feedback chips so a product's positive-feedback share lands on target.
 * Happy customers pick positive attributes; 4★ and below can also flag one
 * thing to improve, which is exactly what that share measures.
 */
function assignTags(list: Entry[], positiveShare: number) {
  let positives = 0
  for (const entry of list) {
    if (entry.rating >= 4) {
      entry.tags = sampleTags(POSITIVE_POOL, intBetween(1, 3))
      positives += entry.tags.length
    } else {
      entry.tags = []
    }
  }

  let needed = Math.max(0, Math.round((positives * (1 - positiveShare)) / positiveShare))
  const lows = list.filter((entry) => entry.rating <= 3)
  for (const entry of lows) {
    entry.tags = sampleTags(ISSUE_TAGS, 1)
    needed -= 1
  }

  const carriers = [...lows, ...list.filter((entry) => entry.rating === 4)]
  for (let guard = 0; needed > 0 && carriers.length && guard < carriers.length * 4; guard++) {
    const entry = carriers[guard % carriers.length]
    const cap = entry.rating <= 3 ? 4 : 3
    const issues = entry.tags.filter((tag) => !isPositiveTag(tag)).length
    if (issues >= cap) continue
    const added = sampleTags(ISSUE_TAGS, 1, entry.tags)
    if (!added.length) continue
    entry.tags = [...entry.tags, ...added]
    needed -= 1
  }
}

function phraseFor(entry: Entry): string {
  const product = productById(entry.productId)!
  const outlet = outletById(entry.outletId)!
  const mixed = entry.rating === 4 && entry.tags.some((tag) => !isPositiveTag(tag))
  const bank = entry.rating <= 3 ? NEGATIVE_PHRASES : mixed ? NEUTRAL_PHRASES : POSITIVE_PHRASES
  return pick(bank)
    .replaceAll('{product}', product.name)
    .replaceAll('{outlet}', outlet.name)
    .replaceAll('{city}', outlet.city)
}

const outletWeights = [0.46, 0.3, 0.24] // Thane, Bandra, Lower Parel

function weightedOutlet(): Outlet {
  const r = rand()
  let acc = 0
  for (let i = 0; i < outlets.length; i++) {
    acc += outletWeights[i]
    if (r <= acc) return outlets[i]
  }
  return outlets[outlets.length - 1]
}

function qrForEntry(outlet: Outlet, product: Product): QRCodeRecord {
  const productCode = qrCodes.find((q) => q.productId === product.id && q.outletId === outlet.id)
  if (productCode && rand() < 0.25) return productCode
  const pool = qrCodes.filter((q) => q.outletId === outlet.id && q.status !== 'archived')
  const weighted = pool.filter((q) => (q.type === 'table' ? true : rand() < 0.35))
  return pick(weighted.length ? weighted : pool)
}

let entrySeq = 0

function makeEntry(product: Product, rating: number, daysAgo: number): Entry {
  const outlet = weightedOutlet()
  const qr = qrForEntry(outlet, product)
  const kind = rating >= 4 ? 'review' : 'feedback'
  const publicClick = kind === 'review' && rand() < 0.63
  const customer = rand() < 0.58 ? pick(customers) : undefined
  const status =
    kind === 'feedback' ? (rand() < 0.55 ? 'resolved' : rand() < 0.5 ? 'in-progress' : 'new') : 'resolved'
  return {
    id: `ent-${(entrySeq++).toString().padStart(5, '0')}`,
    kind,
    businessId: business.id,
    outletId: outlet.id,
    productId: product.id,
    qrId: qr.id,
    rating,
    tags: [],
    comment: '',
    customerId: customer?.id,
    createdAt: timestamp(daysAgo),
    publicClick,
    destination: publicClick ? ((rand() < 0.82 ? 'google' : 'instagram') as Destination) : undefined,
    status: status as Entry['status'],
    reply:
      kind === 'feedback' && status === 'resolved'
        ? 'Thank you for flagging this — the outlet manager has been briefed and we added a check to the shift routine.'
        : undefined,
  }
}

/** Skew timestamps towards weekends and recent days, like real footfall. */
function weightedDay(from: number, to: number): number {
  const span = to - from
  for (let attempt = 0; attempt < 6; attempt++) {
    const day = from + Math.floor(rand() * span)
    const date = new Date(TODAY.getTime() - day * DAY)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    const recency = 1 - (day - from) / (span * 2.2)
    if (rand() < (weekend ? 1 : 0.72) * recency) return day
  }
  return from + Math.floor(rand() * span)
}

function buildWindow(fromDay: number, toDay: number, ratingDelta: number, scale: number): Entry[] {
  const built: Entry[] = []
  for (const product of products) {
    const count = Math.max(0, Math.round(product.target.reviews * scale))
    if (!count) continue
    const mean = Math.min(5, Math.max(2.8, product.target.rating + ratingDelta))
    const positive = Math.min(0.97, Math.max(0.4, product.target.positive + ratingDelta * 0.45))
    const forProduct = ratingSpread(count, mean).map((rating) =>
      makeEntry(product, rating, weightedDay(fromDay, toDay)),
    )
    assignTags(forProduct, positive)
    for (const entry of forProduct) {
      entry.comment = rand() < (entry.kind === 'feedback' ? 0.95 : 0.7) ? phraseFor(entry) : ''
    }
    built.push(...forProduct)
  }
  return built
}

function buildEntries(): Entry[] {
  const current = buildWindow(0, 30, 0, 1) // last 30 days — hits the demo targets exactly
  const previous = buildWindow(30, 60, -0.27, 0.846) // prior period: lower volume, lower ratings
  const older = [
    ...buildWindow(60, 90, -0.35, 0.78),
    ...buildWindow(90, 120, -0.42, 0.7),
    ...buildWindow(120, 180, -0.5, 1.05),
  ]
  return [...current, ...previous, ...older].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export const entries = buildEntries()
export const reviews = entries.filter((e) => e.kind === 'review')
export const feedback = entries.filter((e) => e.kind === 'feedback')

/* ------------------------------------------------------------------ *
 * Scans — every completed entry came from a scan; the rest bounced.
 * Scan events are modelled explicitly so scan counts stay consistent
 * whether they are sliced by day, outlet, QR code or campaign.
 * ------------------------------------------------------------------ */

/**
 * Split `total` into integer parts proportional to `weights`
 * (largest-remainder method, so the parts always sum to `total`).
 */
export function distributeInteger(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0)
  if (weightSum <= 0 || total <= 0) return weights.map(() => 0)
  const exact = weights.map((w) => (w / weightSum) * total)
  const parts = exact.map(Math.floor)
  let remaining = total - parts.reduce((a, b) => a + b, 0)
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
  for (let i = 0; remaining > 0; i++, remaining--) parts[order[i % order.length].index] += 1
  return parts
}

export type ScanEvent = {
  id: string
  createdAt: string
  outletId: string
  qrId: string
  productId?: string
  converted: boolean
  entryId?: string
}

/** Scan totals for the two headline windows are fixed demo figures. */
const SCAN_TARGETS: { from: number; to: number; total?: number; conversion?: number }[] = [
  { from: 0, to: 30, total: 1248 },
  { from: 30, to: 60, total: 1114 },
  { from: 60, to: 90, conversion: 0.233 },
  { from: 90, to: 180, conversion: 0.214 },
]

function buildScanEvents(): ScanEvent[] {
  const events: ScanEvent[] = []
  let seq = 0

  for (const entry of entries) {
    events.push({
      id: `scn-${(seq++).toString().padStart(5, '0')}`,
      createdAt: entry.createdAt,
      outletId: entry.outletId,
      qrId: entry.qrId,
      productId: entry.productId,
      converted: true,
      entryId: entry.id,
    })
  }

  for (const window of SCAN_TARGETS) {
    const inWindow = entries.filter((entry) => {
      const daysAgo = Math.round((TODAY.getTime() - new Date(dayKey(entry.createdAt)).getTime()) / DAY)
      return daysAgo >= window.from && daysAgo < window.to
    })
    const total = window.total ?? Math.round(inWindow.length / (window.conversion ?? 0.24))
    const bounced = Math.max(0, total - inWindow.length)

    // weight each day by its own activity so bounced scans follow real footfall
    const days = Array.from({ length: window.to - window.from }, (_, i) => window.from + i)
    const weights = days.map((day) => {
      const date = new Date(TODAY.getTime() - day * DAY)
      const onDay = inWindow.filter((entry) => dayKey(entry.createdAt) === date.toISOString().slice(0, 10)).length
      const weekend = date.getDay() === 0 || date.getDay() === 6
      return onDay * 2 + (weekend ? 3 : 2)
    })

    distributeInteger(bounced, weights).forEach((count, index) => {
      for (let i = 0; i < count; i++) {
        const outlet = weightedOutlet()
        const pool = qrCodes.filter((q) => q.outletId === outlet.id && q.status === 'active')
        const qr = pick(pool.length ? pool : qrCodes)
        events.push({
          id: `scn-${(seq++).toString().padStart(5, '0')}`,
          createdAt: timestamp(days[index]),
          outletId: outlet.id,
          qrId: qr.id,
          productId: qr.productId,
          converted: false,
        })
      }
    })
  }

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const scanEvents = buildScanEvents()

export type ScanPointSeries = ScanPoint[]

/** Daily scan/review series for the whole history (oldest first). */
export function buildSeries(events: ScanEvent[], days: number): ScanPoint[] {
  const byDay = new Map<string, { scans: number; reviews: number }>()
  for (let day = days - 1; day >= 0; day--) {
    const date = new Date(TODAY.getTime() - day * DAY)
    byDay.set(date.toISOString().slice(0, 10), { scans: 0, reviews: 0 })
  }
  for (const event of events) {
    const bucket = byDay.get(dayKey(event.createdAt))
    if (!bucket) continue
    bucket.scans += 1
    if (event.converted) bucket.reviews += 1
  }
  return [...byDay.entries()].map(([date, value]) => ({ date, ...value }))
}

export const scanSeries = buildSeries(scanEvents, 180)

/* ------------------------------------------------------------------ *
 * Campaigns
 * ------------------------------------------------------------------ */

function buildCampaigns(): Campaign[] {
  const campaignQRs = qrCodes.filter((q) => q.type === 'campaign')
  const specs: Omit<Campaign, 'qrIds' | 'scans' | 'reviews'>[] = [
    {
      id: 'cmp-monsoon',
      name: 'Monsoon Menu 2026',
      goal: 'Drive reviews for the new monsoon dessert range',
      channel: 'Instagram story + table tent',
      status: 'live',
      startedAt: timestamp(21),
    },
    {
      id: 'cmp-brunch',
      name: 'Weekend Brunch',
      goal: 'Grow Saturday footfall at Lower Parel',
      channel: 'Flyer drop + bill QR',
      status: 'live',
      startedAt: timestamp(44),
    },
    {
      id: 'cmp-diwali',
      name: 'Diwali Hampers',
      goal: 'Collect product feedback on gifting hampers',
      channel: 'Packaging insert',
      status: 'ended',
      startedAt: timestamp(150),
    },
    {
      id: 'cmp-loyalty',
      name: 'Regulars Club',
      goal: 'Invite repeat customers to the loyalty list',
      channel: 'Counter standee',
      status: 'scheduled',
      startedAt: timestamp(-7),
    },
  ]
  return specs.map((spec, i) => {
    const qr = campaignQRs[i]
    const scans = [412, 268, 690, 0][i]
    const reviews = [118, 61, 154, 0][i]
    return { ...spec, qrIds: qr ? [qr.id] : [], scans, reviews }
  })
}

export const campaigns = buildCampaigns()

/* ------------------------------------------------------------------ *
 * QR performance (derived)
 * ------------------------------------------------------------------ */

export type QRStats = { scans: number; reviews: number; rating: number }

export function qrStats(qrId: string): QRStats {
  const own = entries.filter((e) => e.qrId === qrId)
  const scans = scanEvents.filter((e) => e.qrId === qrId).length
  const rating = own.length ? own.reduce((total, e) => total + e.rating, 0) / own.length : 0
  return { scans, reviews: own.length, rating }
}

export const teamMembers = [
  { id: 'usr-1', name: 'Ritika Shah', email: 'ritika@loveandlatte.in', role: 'Owner', outlet: 'All outlets' },
  { id: 'usr-2', name: 'Nikita Rane', email: 'nikita@loveandlatte.in', role: 'Outlet Manager', outlet: 'Thane' },
  { id: 'usr-3', name: 'Arjun Mehta', email: 'arjun@loveandlatte.in', role: 'Outlet Manager', outlet: 'Bandra' },
  { id: 'usr-4', name: 'Sara Dsouza', email: 'sara@loveandlatte.in', role: 'Outlet Manager', outlet: 'Lower Parel' },
  { id: 'usr-5', name: 'Dev Kapoor', email: 'dev@loveandlatte.in', role: 'Analyst', outlet: 'All outlets' },
]
