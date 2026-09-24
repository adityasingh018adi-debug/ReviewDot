'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bike,
  Check,
  CheckCircle2,
  Coffee,
  Instagram,
  LayoutGrid,
  Monitor,
  Package,
  PhoneCall,
  PlayCircle,
  QrCode,
  Receipt,
  ScanLine,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Table2,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Stars } from '@/components/ui/Stars'
import { GoogleGlyph } from '@/components/ui/GoogleGlyph'
import { QRPreview } from '@/components/qr/QRPreview'
import { Reveal } from '@/components/marketing/Section'
import { cn, formatNumber } from '@/lib/utils'

/**
 * The marketing home page.
 *
 * Two things about the figures here, because they are not the same kind of
 * number as the ones inside the product. The hero counters (10K+ businesses,
 * 1M+ reviews, 4.8★, +62%), the dashboard preview and the testimonials are
 * **illustrative marketing copy**, not measurements — see the note in README.
 * Nothing on this page is read from a database, and nothing inside a signed-in
 * account is ever allowed to work this way: there, every figure comes from that
 * business's own rows. Replace the testimonials with real ones as soon as there
 * are real ones to use.
 */

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-canvas to-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-14 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:pb-20 lg:pt-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
            <Sparkles size={13} /> AI review assistant
          </span>

          <h1 className="mt-5 text-balance-tight font-display text-[38px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[52px]">
            Just tell us
            <br />
            what you had.
            <br />
            <span className="text-accent">AI writes the review.</span>
          </h1>

          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
            Turn every customer experience into a beautiful review. Just enter the item name and
            we&rsquo;ll create a ready-to-post review for Google, Zomato, Swiggy or Instagram.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Start free now <ArrowRight size={17} />
            </ButtonLink>
            <ButtonLink href="/product" size="lg" variant="secondary">
              <PlayCircle size={18} /> See how it works
            </ButtonLink>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {['No card required', 'Set up in minutes', 'Works for single or multiple outlets'].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <Check size={14} className="text-accent" strokeWidth={2.6} /> {item}
                </li>
              ),
            )}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <HeroScene />
        </Reveal>
      </div>
    </section>
  )
}

/** The table standee beside the phone that writes the review. */
function HeroScene() {
  return (
    <div className="relative mx-auto flex max-w-[520px] items-end justify-center gap-3">
      <div className="hidden w-[190px] shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-card sm:block">
        <p className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
          <span className="grid size-5 place-items-center rounded bg-accent text-on-accent">
            <QrCode size={12} />
          </span>
          ReviewDot
        </p>
        <p className="mt-1 text-[11px] text-muted">Scan. Eat. Review.</p>
        {/* dark on light in both themes — inverted codes fail on many scanners */}
        <QRPreview value="https://reviewdot.in/r/demo" size={140} className="mx-auto my-3" />
        <p className="text-center text-[11px] leading-snug text-muted">
          Let your feedback
          <br />
          make us better!
        </p>
      </div>

      <div className="w-[236px] shrink-0 rounded-[28px] border border-line-strong bg-coal-900 p-1.5 shadow-float">
        <div className="overflow-hidden rounded-[22px] bg-surface">
          <div className="border-b border-line px-3 py-2.5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-ink">
              <span className="grid size-4 place-items-center rounded bg-accent text-on-accent">
                <QrCode size={10} />
              </span>
              ReviewDot
            </p>
          </div>
          <div className="space-y-2.5 p-3">
            <p className="text-[12px] font-semibold text-ink">What did you have today?</p>
            <p className="rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[11px] text-ink-soft">
              Mango Cheesecake
            </p>
            <div className="h-16 rounded-lg bg-gradient-to-br from-amber-200 via-amber-100 to-brand-100" />
            <Stars value={5} size={13} />
            <p className="text-[10.5px] leading-relaxed text-muted">
              &ldquo;I really enjoyed the Mango Cheesecake! It was creamy, fresh and full of real
              mango flavour. The presentation was beautiful and the overall experience was great.
              Definitely coming back for more!&rdquo;
            </p>
            <button className="w-full rounded-lg bg-accent py-1.5 text-[11px] font-semibold text-on-accent">
              Looks good →
            </button>
            <button className="w-full rounded-lg border border-line py-1.5 text-[11px] font-medium text-ink-soft">
              Edit review
            </button>
          </div>
        </div>
      </div>

      <p className="absolute -top-2 right-0 hidden max-w-[110px] font-hand text-[17px] leading-tight text-ink-soft lg:block">
        From a single item to a perfect review
      </p>
    </div>
  )
}

/* ----------------------------------------------------------------- stats */

const STATS = [
  { icon: Store, value: '10K+', label: 'Businesses' },
  { icon: Sparkles, value: '1M+', label: 'Customer Reviews' },
  { icon: Star, value: '4.8★', label: 'Average Rating' },
  { icon: TrendingUp, value: '+62%', label: 'Increase in Reviews' },
]

function StatsBar() {
  return (
    <section className="mx-auto -mt-2 max-w-6xl px-5">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-card sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 bg-surface px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-accent">
              <stat.icon size={18} strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[22px] font-bold leading-none tracking-tight text-ink">
                {stat.value}
              </p>
              <p className="mt-1 truncate text-[12px] text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- platforms */

const PLATFORMS = [
  { name: 'Google', lines: ['More reviews', 'Better visibility'], color: '#4285f4', mark: 'google' },
  { name: 'Zomato', lines: ['Increase', 'food orders'], color: '#e23744', mark: 'Z' },
  { name: 'Swiggy', lines: ['Better feedback', 'Higher repeat orders'], color: '#fc8019', mark: 'S' },
  { name: 'Instagram', lines: ['Grow your brand', 'More engagement'], color: '#c13584', mark: 'instagram' },
]

function Platforms() {
  return (
    <section className="mx-auto mt-4 max-w-6xl px-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((platform) => (
          <div
            key={platform.name}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft"
          >
            <PlatformMark platform={platform} />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink">{platform.name}</p>
              {platform.lines.map((line) => (
                <p key={line} className="truncate text-[11.5px] leading-snug text-muted">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlatformMark({ platform }: { platform: (typeof PLATFORMS)[number] }) {
  if (platform.mark === 'google') {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface">
        <GoogleGlyph size={19} />
      </span>
    )
  }
  if (platform.mark === 'instagram') {
    return (
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
        style={{ background: 'linear-gradient(135deg,#f9ce34,#ee2a7b 45%,#6228d7)' }}
      >
        <Instagram size={19} strokeWidth={2.2} />
      </span>
    )
  }
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-bold text-white"
      style={{ backgroundColor: platform.color }}
    >
      {platform.mark}
    </span>
  )
}

/* ------------------------------------------------------------ how it works */

const STEPS = [
  {
    title: 'Customer enters only the item name',
    detail: 'Example: Mango Cheesecake',
    screen: (
      <>
        <p className="text-[11px] font-semibold text-ink">What did you have today?</p>
        <p className="rounded-lg border border-line bg-raised px-2 py-1.5 text-[10px] text-ink-soft">
          Mango Cheesecake
        </p>
        <div className="h-14 rounded-lg bg-gradient-to-br from-amber-200 to-brand-100" />
        <button className="w-full rounded-lg bg-accent py-1.5 text-[10px] font-semibold text-on-accent">
          Next →
        </button>
      </>
    ),
  },
  {
    title: 'AI creates a complete review',
    detail: 'Using our AI based on the product',
    screen: (
      <>
        <p className="text-[11px] font-semibold text-ink">AI is writing your review…</p>
        {['Adding taste & freshness', 'Including presentation', 'Adding overall experience', 'Making it unique'].map(
          (line) => (
            <p
              key={line}
              className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1.5 text-[9.5px] text-brand-800"
            >
              <Check size={10} strokeWidth={3} /> {line}
            </p>
          ),
        )}
      </>
    ),
  },
  {
    title: 'Customer reviews and can edit',
    detail: 'Edit or approve the AI draft',
    screen: (
      <>
        <p className="text-[11px] font-semibold text-ink">Your AI review draft</p>
        <Stars value={5} size={12} />
        <p className="text-[9.5px] leading-relaxed text-muted">
          &ldquo;I really enjoyed the Mango Cheesecake! It was creamy, fresh and full of real mango
          flavour. The presentation was beautiful.&rdquo;
        </p>
        <button className="w-full rounded-lg bg-accent py-1.5 text-[10px] font-semibold text-on-accent">
          Looks good →
        </button>
        <button className="w-full rounded-lg border border-line py-1.5 text-[10px] text-ink-soft">
          Edit review
        </button>
      </>
    ),
  },
  {
    title: 'Choose a platform to post',
    detail: 'One tap to your preferred platform',
    screen: (
      <>
        <p className="text-[11px] font-semibold text-ink">Where would you like to post your review?</p>
        {PLATFORMS.map((platform) => (
          <p
            key={platform.name}
            className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-[10px] font-medium text-ink"
          >
            <span
              className="size-4 shrink-0 rounded"
              style={{
                background:
                  platform.mark === 'instagram'
                    ? 'linear-gradient(135deg,#f9ce34,#ee2a7b 45%,#6228d7)'
                    : platform.color,
              }}
            />
            Post on {platform.name}
          </p>
        ))}
      </>
    ),
  },
  {
    title: 'Review posted successfully',
    detail: 'More reviews, happier customers',
    screen: (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-brand-100 text-accent">
          <CheckCircle2 size={26} strokeWidth={2.2} />
        </span>
        <p className="text-[11px] font-semibold text-ink">Thank you!</p>
        <p className="text-[9.5px] leading-snug text-muted">
          Your review has been posted successfully
        </p>
      </div>
    ),
  },
]

function HowItWorks() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-5">
      <div className="text-center">
        <h2 className="font-display text-[28px] font-bold tracking-tight text-ink sm:text-[34px]">
          How ReviewDot Works?
        </h2>
        <p className="mt-2 text-[14px] text-muted">
          A simple process for customers. Big results for your business.
        </p>
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.05}>
            <div className="flex h-full flex-col">
              <div className="rounded-[22px] border border-line-strong bg-coal-900 p-1.5 shadow-card">
                <div className="flex h-[228px] flex-col gap-1.5 overflow-hidden rounded-[17px] bg-surface p-2.5">
                  {step.screen}
                </div>
              </div>
              <div className="mt-3 flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-ink">{step.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{step.detail}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- three pillars */

const TOUCHPOINTS = [
  { label: 'Table', icon: Table2 },
  { label: 'Counter', icon: Store },
  { label: 'Menu', icon: UtensilsCrossed },
  { label: 'Bill', icon: Receipt },
  { label: 'Packaging', icon: Package },
  { label: 'Takeaway Bag', icon: ShoppingBag },
  { label: 'Social Media', icon: Instagram },
  { label: 'Display Stand', icon: Monitor },
  { label: 'Delivery Box', icon: Bike },
]

const TOP_PRODUCTS = [
  { name: 'Mango Cheesecake', reviews: 86, rating: 4.9, positive: 91 },
  { name: 'Tiramisu', reviews: 72, rating: 4.8, positive: 89 },
  { name: 'Caesar Salad', reviews: 54, rating: 4.6, positive: 84 },
  { name: 'Croissant', reviews: 43, rating: 4.5, positive: 81 },
  { name: 'Iced Latte', reviews: 38, rating: 4.4, positive: 78 },
]

function Pillars() {
  return (
    <section className="mx-auto mt-16 grid max-w-6xl gap-5 px-5 lg:grid-cols-[1fr_1.15fr_0.85fr]">
      <Reveal>
        <div className="h-full rounded-3xl border border-line bg-surface p-5 shadow-soft">
          <PillarHead icon={QrCode} title="QR Everywhere" />
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Place ReviewDot QR at every customer touchpoint.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {TOUCHPOINTS.map((point) => (
              <div
                key={point.label}
                className="rounded-xl border border-line bg-raised p-2 text-center"
              >
                <point.icon size={15} className="mx-auto text-accent" />
                <p className="mt-1.5 truncate text-[10px] text-ink-soft">{point.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="h-full rounded-3xl border border-line bg-surface p-5 shadow-soft">
          <PillarHead icon={BarChart3} title="Product Intelligence" />
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Know exactly which product, table and outlet the feedback came from.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['Top Products', 'Outlets', 'Time', 'Sentiment'].map((tab, index) => (
              <span
                key={tab}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-medium',
                  index === 0 ? 'bg-accent text-on-accent' : 'bg-raised text-muted',
                )}
              >
                {tab}
              </span>
            ))}
          </div>
          <table className="mt-3 w-full text-[11.5px]">
            <thead>
              <tr className="text-[9.5px] uppercase tracking-wide text-faint">
                <th className="pb-1.5 text-left font-semibold">Product</th>
                <th className="pb-1.5 text-right font-semibold">Reviews</th>
                <th className="pb-1.5 text-right font-semibold">Rating</th>
                <th className="pb-1.5 text-right font-semibold">Positive</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((product) => (
                <tr key={product.name} className="border-t border-line">
                  <td className="py-1.5 font-medium text-ink">{product.name}</td>
                  <td className="py-1.5 text-right tabular-nums text-ink-soft">{product.reviews}</td>
                  <td className="py-1.5 text-right tabular-nums text-ink-soft">{product.rating}</td>
                  <td className="py-1.5 text-right tabular-nums font-medium text-accent">
                    {product.positive}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link
            href="/product"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-on-accent"
          >
            View detailed analytics <ArrowRight size={13} />
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="h-full rounded-3xl border border-line bg-surface p-5 shadow-soft">
          <PillarHead icon={Sparkles} title="Private Feedback" />
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Low ratings go to you directly for quick resolution.
          </p>
          <div className="mx-auto mt-4 w-[186px] rounded-[22px] border border-line-strong bg-coal-900 p-1.5">
            <div className="space-y-2 rounded-[17px] bg-surface p-3">
              <p className="text-[11px] font-semibold text-ink">We&rsquo;re sorry to hear that.</p>
              <p className="text-[10px] text-muted">Help us improve.</p>
              <div className="flex flex-wrap gap-1.5">
                {['Too Sweet', 'Long Wait', 'Small Portion', 'Pricing', 'Service Issue'].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-lg border border-line px-1.5 py-1 text-[9.5px] text-ink-soft"
                    >
                      {chip}
                    </span>
                  ),
                )}
              </div>
              <p className="rounded-lg border border-line bg-raised px-2 py-3 text-[9.5px] text-faint">
                Tell us what went wrong…
              </p>
              <button className="w-full rounded-lg bg-accent py-1.5 text-[10px] font-semibold text-on-accent">
                Submit
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function PillarHead({ icon: Icon, title }: { icon: typeof QrCode; title: string }) {
  return (
    <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
      <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-accent">
        <Icon size={15} />
      </span>
      {title}
    </p>
  )
}

/* -------------------------------------------------------- dashboard preview */

const NAV_PREVIEW = [
  'Overview',
  'Reviews',
  'Feedback',
  'Outlets',
  'Products',
  'Campaigns',
  'Customers',
  'Reports',
  'Settings',
]

const PREVIEW_TILES = [
  { label: 'Total Scans', value: '24,850', delta: '12.8%', icon: ScanLine },
  { label: 'Reviews', value: '5,846', delta: '18.4%', icon: Sparkles },
  { label: 'Avg Rating', value: '4.8', delta: '0.3', icon: Star },
  { label: 'Positive Feedback', value: '92%', delta: '6.2%', icon: TrendingUp },
]

const AI_NOTES = [
  'Mango Cheesecake has 91% positive feedback this month.',
  'Customers love the fresh presentation and taste.',
  'Wait time feedback increased at Thane outlet.',
  'Consider promoting Tiramisu — high repeat orders.',
]

function DashboardPreview() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-5">
      <Reveal>
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <PillarHead icon={LayoutGrid} title="Powerful Dashboard" />
          <p className="mt-1.5 text-[12.5px] text-muted">
            All your reviews, feedback, analytics and outlets in one place.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[130px_1fr_215px]">
            <ul className="hidden space-y-0.5 lg:block">
              {NAV_PREVIEW.map((item, index) => (
                <li
                  key={item}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-[11.5px]',
                    index === 0 ? 'bg-brand-50 font-medium text-accent' : 'text-muted',
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="min-w-0 space-y-3">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {PREVIEW_TILES.map((tile) => (
                  <div key={tile.label} className="rounded-xl border border-line bg-raised p-2.5">
                    <tile.icon size={13} className="text-accent" />
                    <p className="mt-1.5 font-display text-[17px] font-bold leading-none text-ink">
                      {tile.value}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-muted">{tile.label}</p>
                    <p className="text-[10px] font-semibold text-accent">↑ {tile.delta}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                <div className="rounded-xl border border-line p-3">
                  <p className="text-[12px] font-semibold text-ink">Reviews Trend</p>
                  <TrendSketch />
                </div>
                <div className="rounded-xl border border-line p-3">
                  <p className="text-[12px] font-semibold text-ink">Feedback Sentiment</p>
                  <SentimentSketch />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-raised p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <Sparkles size={13} className="text-accent" /> AI Insights
              </p>
              <ul className="mt-2.5 space-y-2">
                {AI_NOTES.map((note) => (
                  <li key={note} className="text-[10.5px] leading-snug text-muted">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/** A shape, not a chart: it carries no data and is never read as one. */
function TrendSketch() {
  const points = [14, 18, 16, 24, 22, 30, 28, 36, 34, 44, 42, 52]
  const step = 100 / (points.length - 1)
  const path = points
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${(60 - value).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 60" className="mt-2 h-[86px] w-full" preserveAspectRatio="none" aria-hidden>
      <path d={`${path} L100,60 L0,60 Z`} fill="var(--color-brand-100)" opacity="0.55" />
      <path
        d={path}
        fill="none"
        stroke="var(--color-chart-1)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SentimentSketch() {
  const slices = [
    { label: 'Positive', value: 92, color: 'var(--color-chart-1)' },
    { label: 'Neutral', value: 6, color: 'var(--color-brand-300)' },
    { label: 'Negative', value: 2, color: 'var(--color-danger)' },
  ]
  let offset = 0
  return (
    <div className="mt-2 flex items-center gap-3">
      <svg viewBox="0 0 42 42" className="size-[74px] shrink-0 -rotate-90" aria-hidden>
        {slices.map((slice) => {
          const dash = (slice.value / 100) * 100
          const circle = (
            <circle
              key={slice.label}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={slice.color}
              strokeWidth="6"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return circle
        })}
      </svg>
      <ul className="min-w-0 space-y-1">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            {slice.label}
            <span className="ml-auto tabular-nums text-ink-soft">{slice.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------- segments */

const SEGMENTS = [
  { name: 'Restaurants & Cafés', detail: 'Boost reviews & ratings', icon: Coffee },
  { name: 'Cloud Kitchens', detail: 'Increase food orders', icon: Bike },
  { name: 'Retail & FMCG', detail: 'Get product feedback', icon: ShoppingBag },
  { name: 'Salons & Clinics', detail: 'Improve customer trust', icon: Scissors },
  { name: 'Multi-Outlet Chains', detail: 'Manage all locations', icon: Store },
]

function Segments() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-5">
      <div className="text-center">
        <h2 className="font-display text-[28px] font-bold tracking-tight text-ink sm:text-[34px]">
          Built for Every Business
        </h2>
        <p className="mt-2 text-[14px] text-muted">
          From single outlets to multi-location chains, ReviewDot works for all.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SEGMENTS.map((segment, index) => (
          <Reveal key={segment.name} delay={index * 0.05}>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
              <div className="h-24 bg-gradient-to-br from-brand-100 via-brand-50 to-raised" />
              <div className="flex items-start gap-2 p-3.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-accent">
                  <segment.icon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{segment.name}</p>
                  <p className="truncate text-[11.5px] text-muted">{segment.detail}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ testimonials */

/**
 * Sample testimonials.
 *
 * These are written copy, not quotes from named customers — the page labels
 * them as samples for that reason. Swap them for real ones, with permission,
 * as soon as there are real ones; presenting invented praise as genuine
 * endorsement is the kind of thing that is regulated, not merely impolite.
 */
const TESTIMONIALS = [
  {
    quote: 'Our Google reviews increased by 68% in just 2 months. Very easy to use!',
    name: 'Rohan Mehta',
    role: 'Love & Latte Café',
  },
  {
    quote: 'The AI review feature is amazing. Customers love it and it saves us time.',
    name: 'Priya Shah',
    role: 'Cloud Kitchen Brand',
  },
  {
    quote: 'Finally a tool that works for multiple outlets. Great support and insights.',
    name: 'Amit Verma',
    role: 'Restaurant Chain',
  },
]

function Testimonials() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-5">
      <div className="text-center">
        <h2 className="font-display text-[28px] font-bold tracking-tight text-ink sm:text-[34px]">
          What Our Customers Say
        </h2>
        <p className="mt-2 text-[14px] text-muted">Real businesses. Real results.</p>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <Reveal key={item.name} delay={index * 0.05}>
            <figure className="h-full rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <blockquote className="text-[13.5px] leading-relaxed text-ink-soft">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-800">
                  {item.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {item.name}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">{item.role}</span>
                </span>
                <Stars value={5} size={13} />
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-center text-[11.5px] text-faint">
        Sample testimonials, shown to illustrate the product.
      </p>
    </section>
  )
}

/* ----------------------------------------------------------------- pricing */

const PLANS = [
  {
    name: 'Starter',
    price: 999,
    features: ['1 Outlet', '500 Scans/month', 'Basic Analytics', 'Email Support'],
  },
  {
    name: 'Professional',
    price: 1999,
    popular: true,
    features: [
      'Up to 5 Outlets',
      '5,000 Scans/month',
      'AI Review Assistant',
      'Product & Campaign QR',
      'Priority Support',
    ],
  },
  {
    name: 'Business',
    price: 3999,
    features: [
      'Up to 20 Outlets',
      '25,000 Scans/month',
      'Advanced Analytics',
      'Team Management',
      'Dedicated Support',
    ],
  },
]

function Pricing() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-5">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-800">
            Simple &amp; transparent pricing
          </span>
          <h2 className="mt-4 font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[34px]">
            Plans for Every Stage
            <br />
            of Your Business
          </h2>
          <ul className="mt-5 space-y-2">
            {[
              'Start free and upgrade when you’re ready.',
              'No hidden charges.',
              'All features included',
              'Multiple outlets',
              'AI review assistant',
              'Analytics & reports',
            ].map((line) => (
              <li key={line} className="flex items-center gap-2 text-[13px] text-ink-soft">
                <Check size={14} className="text-accent" strokeWidth={2.6} /> {line}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-2xl border bg-surface p-4 shadow-soft',
                  plan.popular ? 'border-accent shadow-card' : 'border-line',
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-on-accent">
                    Most Popular
                  </span>
                ) : null}
                <p className="text-[13px] font-semibold text-ink">{plan.name}</p>
                <p className="mt-2">
                  <span className="font-display text-[24px] font-bold tracking-tight text-ink">
                    ₹{formatNumber(plan.price)}
                  </span>
                  <span className="text-[12px] text-muted">/month</span>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-[11.5px] text-muted">
                      <Check size={12} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.6} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    'mt-4 block rounded-xl py-2 text-center text-[12.5px] font-semibold transition-opacity hover:opacity-90',
                    plan.popular
                      ? 'bg-accent text-on-accent'
                      : 'border border-line text-ink',
                  )}
                >
                  Start free
                </Link>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- cta band */

function CtaBand() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-gradient-to-r from-brand-800 to-brand-600 px-6 py-7 text-white sm:px-9">
        <div>
          <h2 className="font-display text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
            Turn Every Customer Experience
            <br />
            Into a Review.
          </h2>
          <p className="mt-1.5 text-[13px] text-white/75">
            Join 10,000+ businesses using ReviewDot.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-brand-800 transition-opacity hover:opacity-90"
          >
            Start free now <ArrowRight size={15} />
          </Link>
          <Link
            href="/resources"
            className="flex items-center gap-1.5 rounded-xl border border-white/30 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            <PhoneCall size={15} /> Talk to sales
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ page */

export function Landing() {
  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <Hero />
      <StatsBar />
      <Platforms />
      <HowItWorks />
      <Pillars />
      <DashboardPreview />
      <Segments />
      <Testimonials />
      <Pricing />
      <CtaBand />
    </motion.main>
  )
}
