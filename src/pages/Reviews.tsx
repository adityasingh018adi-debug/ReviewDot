import { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  Star,
  Search,
  Sparkles,
  Check,
  RefreshCw,
  MapPin,
  ThumbsUp,
  ChevronDown,
  Inbox,
  StickyNote,
  Plus,
  SlidersHorizontal,
  Archive,
  Download,
  X,
} from 'lucide-react'
import {
  useDataset,
  PLATFORMS,
  type Review,
  type Sentiment,
  type ReviewStatus,
  type Platform,
} from '@/lib/data'
import { useBusiness } from '@/lib/business'
import { useToasts, useReviewActions } from '@/store/workspace'
import { streamReviewReply, aiIsLive, REPLY_TONES, type ReplyTone } from '@/lib/ai'
import { exportReviewsCsv } from '@/lib/export'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, timeAgo } from '@/lib/utils'

const sentimentTone: Record<Sentiment, 'positive' | 'neutral' | 'negative'> = {
  positive: 'positive',
  neutral: 'neutral',
  negative: 'negative',
}

const statusMeta: Record<ReviewStatus, { label: string; tone: 'accent' | 'positive' | 'neutral' }> = {
  open: { label: 'Open', tone: 'accent' },
  replied: { label: 'Replied', tone: 'positive' },
  closed: { label: 'Closed', tone: 'neutral' },
}

const platformStyle: Record<Platform, { glyph: string; cls: string }> = {
  Google: { glyph: 'G', cls: 'bg-[#4285f4]/15 text-[#7baaf7]' },
  Facebook: { glyph: 'f', cls: 'bg-[#1877f2]/15 text-[#6ea8f7]' },
  TripAdvisor: { glyph: 'T', cls: 'bg-[#34e0a1]/15 text-[#34e0a1]' },
  Trustpilot: { glyph: '★', cls: 'bg-[#00b67a]/15 text-[#2fd396]' },
}

function PlatformIcon({ platform, size = 'sm' }: { platform: Platform; size?: 'sm' | 'md' }) {
  const s = platformStyle[platform]
  return (
    <span
      title={platform}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-md font-bold',
        size === 'sm' ? 'h-4.5 w-4.5 text-[10px]' : 'h-6 w-6 text-xs',
        s.cls,
      )}
    >
      {s.glyph}
    </span>
  )
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'replied', label: 'Replied' },
  { id: 'closed', label: 'Closed' },
  { id: 'negative', label: 'Negative' },
  { id: 'archived', label: 'Archived' },
] as const

type FilterId = (typeof filters)[number]['id']

const dateRanges = [
  { id: 'all', label: 'All time', days: Infinity },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
] as const

type DateRangeId = (typeof dateRanges)[number]['id']

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'text-amber-glow' : 'text-white/15'}
          fill={i < rating ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  )
}

/** AI reply preview with tone selection: streams a Claude draft (or simulation), then approve/regenerate. */
function AiReplyPanel({ review }: { review: Review }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'drafting' | 'ready'>('idle')
  const [tone, setTone] = useState<ReplyTone>('professional')
  const pushToast = useToasts((s) => s.push)
  const publishedReply = useReviewActions((s) => s.overrides[review.id]?.publishedReply)
  const publishReply = useReviewActions((s) => s.publishReply)

  const generate = async (selectedTone: ReplyTone) => {
    setPhase('drafting')
    setText('')
    try {
      const full = await streamReviewReply(review, { onText: (d) => setText((t) => t + d) }, selectedTone)
      setText(full)
      setPhase('ready')
    } catch (err) {
      setPhase('idle')
      pushToast({
        tone: 'error',
        title: 'Draft failed',
        body: err instanceof Error ? err.message : 'Check your AI settings and try again.',
      })
    }
  }

  if (publishedReply) {
    return (
      <div className="rounded-xl border border-mint-400/25 bg-mint-400/6 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-mint-400">
          <Check size={13} /> Published to {review.platform}
        </div>
        <p className="text-sm leading-relaxed text-mist-300">{publishedReply}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-pulse-400/25 bg-pulse-500/8 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-pulse-300">
        <Sparkles size={13} /> AI reply
        {aiIsLive() && <Badge tone="accent">Claude</Badge>}
        {phase === 'drafting' && <span className="font-normal text-mist-500">drafting…</span>}
      </div>

      {/* tone selector */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {REPLY_TONES.map((t) => (
          <button
            key={t.id}
            title={t.hint}
            onClick={() => {
              setTone(t.id)
              if (phase !== 'idle') void generate(t.id)
            }}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              tone === t.id
                ? 'border-pulse-400/50 bg-pulse-500/20 text-pulse-300'
                : 'border-edge bg-white/4 text-mist-400 hover:text-mist-100',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {phase === 'idle' ? (
        <Button variant="glass" size="sm" onClick={() => void generate(tone)} className="border-pulse-400/30">
          <Sparkles size={13} className="text-aura-400" /> Generate {tone} reply
        </Button>
      ) : (
        <>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-mist-200">
            {text}
            {phase === 'drafting' && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-pulse-300 align-middle" />
            )}
          </p>
          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex gap-2"
            >
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  publishReply(review.id, text)
                  pushToast({
                    tone: 'success',
                    title: 'Reply published',
                    body: `Response to ${review.author} is live on ${review.platform}.`,
                  })
                }}
              >
                <Check size={13} /> Approve & publish
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void generate(tone)}>
                <RefreshCw size={13} /> Regenerate
              </Button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

/** Private note for teammates — never shown to the reviewer. */
function InternalNotes({ reviewId }: { reviewId: string }) {
  const note = useReviewActions((s) => s.overrides[reviewId]?.note ?? '')
  const setNote = useReviewActions((s) => s.setNote)
  const [draft, setDraft] = useState(note)
  const [saved, setSaved] = useState(false)

  return (
    <div className="rounded-xl border border-edge bg-white/3 p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-glow">
        <StickyNote size={12} /> Internal notes
        <span className="font-normal text-mist-500">· visible to your team only</span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setSaved(false)
        }}
        onBlur={() => {
          if (draft !== note) {
            setNote(reviewId, draft)
            setSaved(true)
          }
        }}
        rows={2}
        placeholder="e.g. Called the customer, offered a follow-up visit on Tuesday…"
        className="mt-2 w-full resize-y rounded-lg border border-edge bg-white/4 p-2.5 text-sm text-mist-100 placeholder:text-mist-500 outline-none transition-colors focus:border-pulse-400/50"
      />
      {saved && <div className="mt-1 text-[11px] text-mint-400">Saved</div>}
    </div>
  )
}

function TagEditor({ review }: { review: Review }) {
  // select the raw value — defaulting inside the selector would return a fresh [] each call and loop
  const extraTags = useReviewActions((s) => s.overrides[review.id]?.extraTags) ?? []
  const addTag = useReviewActions((s) => s.addTag)
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')

  const commit = () => {
    if (value.trim()) addTag(review.id, value)
    setValue('')
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {[...review.tags, ...extraTags].map((t) => (
        <Badge key={t}>#{t}</Badge>
      ))}
      {adding ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setAdding(false)
          }}
          placeholder="new tag"
          className="h-6 w-24 rounded-full border border-pulse-400/40 bg-white/5 px-2 text-[11px] text-mist-100 outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-edge px-2 py-0.5 text-[11px] text-mist-500 transition-colors hover:border-pulse-400/40 hover:text-pulse-300"
        >
          <Plus size={10} /> tag
        </button>
      )}
    </div>
  )
}

function ReviewCard({
  review,
  index,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  review: Review
  index: number
  expanded: boolean
  selected: boolean
  onToggle: () => void
  onSelect: (checked: boolean) => void
}) {
  const statusOverride = useReviewActions((s) => s.overrides[review.id]?.status)
  const isArchived = useReviewActions((s) => s.overrides[review.id]?.archived) ?? false
  const setStatus = useReviewActions((s) => s.setStatus)
  const setArchived = useReviewActions((s) => s.setArchived)
  const pushToast = useToasts((s) => s.push)
  const status = statusOverride ?? review.status
  const meta = statusMeta[status]

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25) }}
      className={cn(
        'glass overflow-hidden rounded-2xl shadow-panel transition-colors duration-300',
        expanded ? 'border-pulse-400/35' : 'hover:border-white/18',
        selected && 'border-pulse-400/50 bg-pulse-500/6',
      )}
    >
      <div className="flex w-full items-start gap-3 p-5">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          aria-label={`Select review by ${review.author}`}
          className="mt-3 h-4 w-4 shrink-0 cursor-pointer accent-[#6172f3]"
        />

        <button
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
          aria-expanded={expanded}
        >
          <div className="relative shrink-0">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-pulse-500/40 to-aura-500/40 text-sm font-bold text-mist-50 ring-1 ring-white/10">
              {review.initials}
            </span>
            <span className="absolute -right-1.5 -bottom-1.5 rounded-md ring-2 ring-ink-900">
              <PlatformIcon platform={review.platform} />
            </span>
            {status === 'open' && !isArchived && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-pulse-400 shadow-glow-sm" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-mist-50">{review.author}</span>
              <Stars rating={review.rating} />
              <span className="text-xs text-mist-500">· {review.platform}</span>
              <span className="text-xs text-mist-500">· {timeAgo(review.date)}</span>
              <span className="flex items-center gap-1 text-xs text-mist-500">
                · <MapPin size={10} /> {review.location}
              </span>
            </div>
            <h3 className="mt-1 truncate text-sm font-medium text-mist-100">{review.title}</h3>
            <p className={cn('mt-1 text-sm leading-relaxed text-mist-400', !expanded && 'line-clamp-2')}>
              {review.body}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge tone={sentimentTone[review.sentiment]}>{review.sentiment}</Badge>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {isArchived && <Badge>archived</Badge>}
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-glow/25 bg-cyan-glow/8 px-2 py-0.5 text-[11px] text-cyan-glow">
                <Sparkles size={10} />
                {review.sentiment === 'negative'
                  ? 'needs a fast reply'
                  : review.sentiment === 'neutral'
                    ? 'winnable customer'
                    : 'loyal advocate'}
              </span>
            </div>
          </div>

          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="mt-1 shrink-0 text-mist-500"
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={17} />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-edge px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="text-[10px] tracking-widest text-mist-500 uppercase">Reviewer</div>
                  <div className="mt-1 text-sm text-mist-100">Member since {review.reviewerSince}</div>
                  <div className="text-xs text-mist-400">{review.reviewerCount} reviews written</div>
                </div>
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="text-[10px] tracking-widest text-mist-500 uppercase">Context</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-mist-100">
                    <MapPin size={12} className="text-mist-400" /> {review.location}
                  </div>
                  <div className="text-xs text-mist-400">{review.service}</div>
                </div>
                <div className="rounded-xl bg-white/4 p-3">
                  <div className="text-[10px] tracking-widest text-mist-500 uppercase">Status</div>
                  <div className="mt-1.5 flex gap-1">
                    {(Object.keys(statusMeta) as ReviewStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(review.id, s)}
                        className={cn(
                          'rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
                          status === s
                            ? 'bg-pulse-500/20 text-pulse-300 ring-1 ring-pulse-400/40'
                            : 'text-mist-400 hover:bg-white/6 hover:text-mist-100',
                        )}
                      >
                        {statusMeta[s].label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-mist-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} /> {review.helpful} helpful
                    </span>
                    <button
                      onClick={() => {
                        setArchived([review.id], !isArchived)
                        pushToast({
                          tone: 'info',
                          title: isArchived ? 'Review restored' : 'Review archived',
                        })
                      }}
                      className="flex items-center gap-1 transition-colors hover:text-mist-100"
                    >
                      <Archive size={11} /> {isArchived ? 'Restore' : 'Archive'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-edge bg-white/3 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-glow">
                  <Sparkles size={12} /> AI summary
                </div>
                <p className="mt-1.5 text-sm text-mist-300">{review.aiSummary}</p>
              </div>

              <AiReplyPanel review={review} />
              <InternalNotes reviewId={review.id} />
              <TagEditor review={review} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export function Reviews() {
  const dataset = useDataset()
  const activeLocation = useBusiness((s) => s.activeLocation)
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [ratingFilter, setRatingFilter] = useState<Set<number>>(new Set())
  const [platformFilter, setPlatformFilter] = useState<Set<Platform>>(new Set())
  const [dateRange, setDateRange] = useState<DateRangeId>('all')
  // captured once on mount so the date-range filter stays pure during render
  const [now] = useState(() => Date.now())
  const [unansweredOnly, setUnansweredOnly] = useState(false)
  const advancedRef = useRef<HTMLDivElement>(null)
  const overrides = useReviewActions((s) => s.overrides)
  const setArchived = useReviewActions((s) => s.setArchived)
  const markReplied = useReviewActions((s) => s.markReplied)
  const pushToast = useToasts((s) => s.push)

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!advancedRef.current?.contains(e.target as Node)) setAdvancedOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])

  const activeAdvanced =
    ratingFilter.size + platformFilter.size + (dateRange !== 'all' ? 1 : 0) + (unansweredOnly ? 1 : 0)

  const filtered = useMemo(() => {
    const effectiveStatus = (r: Review) => overrides[r.id]?.status ?? r.status
    const isArchived = (r: Review) => overrides[r.id]?.archived ?? false
    const rangeDays = dateRanges.find((d) => d.id === dateRange)?.days ?? Infinity
    const cutoff = now - rangeDays * 24 * 3600 * 1000

    let list = dataset.reviews

    if (filter === 'archived') list = list.filter(isArchived)
    else {
      list = list.filter((r) => !isArchived(r))
      if (filter === 'negative') list = list.filter((r) => r.sentiment === 'negative')
      else if (filter !== 'all') list = list.filter((r) => effectiveStatus(r) === filter)
    }

    if (activeLocation !== 'all') list = list.filter((r) => r.location === activeLocation)
    if (ratingFilter.size) list = list.filter((r) => ratingFilter.has(r.rating))
    if (platformFilter.size) list = list.filter((r) => platformFilter.has(r.platform))
    if (dateRange !== 'all') list = list.filter((r) => r.date.getTime() >= cutoff)
    if (unansweredOnly) list = list.filter((r) => effectiveStatus(r) === 'open')

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (r) =>
          r.author.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q) ||
          r.tags.some((t) => t.includes(q)),
      )
    }
    return list
  }, [
    dataset,
    filter,
    query,
    overrides,
    activeLocation,
    ratingFilter,
    platformFilter,
    dateRange,
    unansweredOnly,
    now,
  ])

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const bulk = (action: 'reply' | 'archive' | 'export') => {
    const ids = [...selected]
    if (action === 'reply') {
      markReplied(ids)
      pushToast({
        tone: 'success',
        title: `AI replies published for ${ids.length} reviews`,
        body: 'Each reply was tone-matched to the reviewer.',
      })
    } else if (action === 'archive') {
      setArchived(ids, true)
      pushToast({ tone: 'info', title: `${ids.length} reviews archived` })
    } else {
      exportReviewsCsv(dataset, new Set(ids))
      pushToast({ tone: 'success', title: 'Export ready', body: `${ids.length} reviews downloaded as CSV.` })
    }
    setSelected(new Set())
  }

  const openCount = dataset.reviews.filter((r) => (overrides[r.id]?.status ?? r.status) === 'open').length

  return (
    <div className="space-y-5 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-mist-400">
          {dataset.reviews.length} reviews across 4 platforms · {openCount} open
          {activeLocation !== 'all' && ` · showing ${activeLocation}`}
        </p>
      </motion.div>

      {/* sticky filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="glass-strong sticky top-[84px] z-20 flex flex-wrap items-center gap-2 rounded-2xl p-2 shadow-panel"
      >
        <LayoutGroup id="review-filters">
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'relative rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                  filter === f.id ? 'text-mist-50' : 'text-mist-400 hover:text-mist-100',
                )}
              >
                {filter === f.id && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-xl border border-pulse-400/30 bg-pulse-500/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        {/* advanced filters */}
        <div className="relative" ref={advancedRef}>
          <button
            onClick={() => setAdvancedOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
              activeAdvanced
                ? 'border-pulse-400/40 bg-pulse-500/12 text-pulse-300'
                : 'border-edge bg-white/4 text-mist-400 hover:text-mist-100',
            )}
          >
            <SlidersHorizontal size={13} /> Filters
            {activeAdvanced > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-pulse-500 text-[10px] font-bold text-pure">
                {activeAdvanced}
              </span>
            )}
          </button>

          <AnimatePresence>
            {advancedOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="glass-strong absolute top-11 left-0 z-40 w-72 space-y-4 rounded-2xl p-4 shadow-float"
              >
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold tracking-widest text-mist-500 uppercase">
                    Rating
                  </div>
                  <div className="flex gap-1">
                    {[5, 4, 3, 2, 1].map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          setRatingFilter((prev) => {
                            const next = new Set(prev)
                            if (next.has(r)) next.delete(r)
                            else next.add(r)
                            return next
                          })
                        }
                        className={cn(
                          'flex flex-1 items-center justify-center gap-0.5 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                          ratingFilter.has(r)
                            ? 'border-amber-glow/50 bg-amber-glow/12 text-amber-glow'
                            : 'border-edge bg-white/4 text-mist-400 hover:text-mist-100',
                        )}
                      >
                        {r}
                        <Star size={9} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[10px] font-semibold tracking-widest text-mist-500 uppercase">
                    Platform
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          setPlatformFilter((prev) => {
                            const next = new Set(prev)
                            if (next.has(p)) next.delete(p)
                            else next.add(p)
                            return next
                          })
                        }
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors',
                          platformFilter.has(p)
                            ? 'border-pulse-400/50 bg-pulse-500/12 text-mist-50'
                            : 'border-edge bg-white/4 text-mist-400 hover:text-mist-100',
                        )}
                      >
                        <PlatformIcon platform={p} /> {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[10px] font-semibold tracking-widest text-mist-500 uppercase">
                    Date
                  </div>
                  <div className="flex gap-1">
                    {dateRanges.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDateRange(d.id)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors',
                          dateRange === d.id
                            ? 'border-pulse-400/50 bg-pulse-500/12 text-mist-50'
                            : 'border-edge bg-white/4 text-mist-400 hover:text-mist-100',
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between text-xs text-mist-200">
                  Unanswered only
                  <input
                    type="checkbox"
                    checked={unansweredOnly}
                    onChange={(e) => setUnansweredOnly(e.target.checked)}
                    className="h-4 w-4 accent-[#6172f3]"
                  />
                </label>

                {activeAdvanced > 0 && (
                  <button
                    onClick={() => {
                      setRatingFilter(new Set())
                      setPlatformFilter(new Set())
                      setDateRange('all')
                      setUnansweredOnly(false)
                    }}
                    className="w-full rounded-lg py-1.5 text-[11px] text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative ml-auto min-w-[160px] flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mist-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter instantly…"
            className="h-9 w-full rounded-xl border border-edge bg-white/4 pl-8 text-sm text-mist-100 placeholder:text-mist-500 transition-colors outline-none focus:border-pulse-400/50"
          />
        </div>
      </motion.div>

      <LayoutGroup id="review-list">
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((r, i) => (
              <ReviewCard
                key={r.id}
                review={r}
                index={i}
                expanded={expandedId === r.id}
                selected={selected.has(r.id)}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onSelect={(checked) => toggleSelect(r.id, checked)}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass grid place-items-center rounded-2xl py-16 text-center"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5">
                <Inbox size={24} className="text-mist-400" />
              </div>
              <div className="font-display mt-4 text-base font-semibold text-mist-100">Nothing matches</div>
              <p className="mt-1 max-w-xs text-sm text-mist-400">
                Try a different filter or search term — or enjoy the rare moment of a clear queue.
              </p>
            </motion.div>
          )}
        </motion.div>
      </LayoutGroup>

      {/* bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass-strong fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl p-2 pl-4 shadow-float md:bottom-6"
          >
            <span className="text-xs font-semibold text-mist-100">{selected.size} selected</span>
            <Button variant="primary" size="sm" onClick={() => bulk('reply')}>
              <Sparkles size={13} /> AI reply all
            </Button>
            <Button variant="glass" size="sm" onClick={() => bulk('archive')}>
              <Archive size={13} /> Archive
            </Button>
            <Button variant="glass" size="sm" onClick={() => bulk('export')}>
              <Download size={13} /> Export
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
            >
              <X size={15} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
