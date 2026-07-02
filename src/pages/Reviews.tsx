import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import { useDataset, type Review, type Sentiment, type ReviewStatus } from '@/lib/data'
import { useToasts, useReviewActions } from '@/store/workspace'
import { streamReviewReply, aiIsLive } from '@/lib/ai'
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

const filters = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'replied', label: 'Replied' },
  { id: 'closed', label: 'Closed' },
  { id: 'negative', label: 'Negative' },
] as const

type FilterId = (typeof filters)[number]['id']

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

/** AI reply preview: streams a Claude-drafted reply (or simulation), then approve/regenerate. */
function AiReplyPanel({ review }: { review: Review }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'drafting' | 'ready'>('idle')
  const pushToast = useToasts((s) => s.push)
  const publishedReply = useReviewActions((s) => s.overrides[review.id]?.publishedReply)
  const publishReply = useReviewActions((s) => s.publishReply)

  const generate = async () => {
    setPhase('drafting')
    setText('')
    try {
      const full = await streamReviewReply(review, {
        onText: (delta) => setText((t) => t + delta),
      })
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

  if (phase === 'idle') {
    return (
      <Button variant="glass" size="sm" onClick={() => void generate()} className="border-pulse-400/30">
        <Sparkles size={13} className="text-aura-400" /> Generate AI reply
        {aiIsLive() && (
          <Badge tone="accent" className="ml-1">
            Claude
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-pulse-400/25 bg-pulse-500/8 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-pulse-300">
          <Sparkles size={13} /> Suggested reply
          {phase === 'drafting' && <span className="font-normal text-mist-500">drafting…</span>}
        </div>
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
            <Button variant="ghost" size="sm" onClick={() => void generate()}>
              <RefreshCw size={13} /> Regenerate
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
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
  onToggle,
}: {
  review: Review
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const statusOverride = useReviewActions((s) => s.overrides[review.id]?.status)
  const setStatus = useReviewActions((s) => s.setStatus)
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
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-5 text-left"
        aria-expanded={expanded}
      >
        <div className="relative shrink-0">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-pulse-500/40 to-aura-500/40 text-sm font-bold text-mist-50 ring-1 ring-white/10">
            {review.initials}
          </span>
          {status === 'open' && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-pulse-400 shadow-glow-sm" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-mist-50">{review.author}</span>
            <Stars rating={review.rating} />
            <span className="text-xs text-mist-500">· {review.platform}</span>
            <span className="text-xs text-mist-500">· {timeAgo(review.date)}</span>
          </div>
          <h3 className="mt-1 truncate text-sm font-medium text-mist-100">{review.title}</h3>
          <p className={cn('mt-1 text-sm leading-relaxed text-mist-400', !expanded && 'line-clamp-2')}>
            {review.body}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={sentimentTone[review.sentiment]}>{review.sentiment}</Badge>
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {review.tags.slice(0, 2).map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
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
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-mist-400">
                    <ThumbsUp size={11} /> {review.helpful} found helpful
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
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const overrides = useReviewActions((s) => s.overrides)

  const filtered = useMemo(() => {
    let list = dataset.reviews
    const effectiveStatus = (r: Review) => overrides[r.id]?.status ?? r.status
    if (filter === 'negative') list = list.filter((r) => r.sentiment === 'negative')
    else if (filter !== 'all') list = list.filter((r) => effectiveStatus(r) === filter)
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
  }, [dataset, filter, query, overrides])

  const openCount = dataset.reviews.filter((r) => (overrides[r.id]?.status ?? r.status) === 'open').length

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-mist-400">
          {dataset.reviews.length} reviews across 4 platforms · {openCount} open
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
                  'relative rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
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

        <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-xs">
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
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
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
    </div>
  )
}
