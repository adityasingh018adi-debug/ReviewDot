'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Building2,
  MessageSquareText,
  Package,
  QrCode,
  Receipt,
  Repeat,
  ScanLine,
  Sparkles,
  Star,
  Store,
  Table2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Stars } from '@/components/ui/Stars'
import { Eyebrow, Reveal, SectionHeading } from '@/components/marketing/Section'
import { FlowVisual } from '@/components/marketing/FlowVisual'
import { ReviewWriterDemo } from '@/components/marketing/ReviewWriterDemo'
import { HeroVisual } from '@/components/marketing/HeroVisual'
import { PhoneFrame } from '@/components/marketing/PhoneFrame'
import { ReviewExperience } from '@/components/review/ReviewExperience'
import { TrendChart } from '@/components/charts/TrendChart'
import { QRPreview } from '@/components/qr/QRPreview'
import { business, demoQR, outlets, products } from '@/lib/data'
import { byProduct, overview, resolveRange, seriesFor } from '@/lib/metrics'
import { scanUrl } from '@/lib/links'
import { formatCompact, formatNumber, formatPercent, formatTrend } from '@/lib/utils'

const HERO_STATS = [
  { value: '10K+', label: 'Businesses' },
  { value: '1M+', label: 'Customer Reviews' },
  { value: '4.8 ★', label: 'Average Rating' },
]

const STEPS = [
  {
    number: '01',
    title: 'Scan',
    icon: ScanLine,
    detail: 'Customer scans the QR code on a table, menu, bill, packaging, counter or social media.',
  },
  {
    number: '02',
    title: 'Rate & Feedback',
    icon: Star,
    detail: 'They rate the specific product or service and give quick, structured feedback.',
  },
  {
    number: '03',
    title: 'Review',
    icon: MessageSquareText,
    detail: 'Satisfied customers can continue to Google or another public review destination.',
  },
  {
    number: '04',
    title: 'Grow',
    icon: TrendingUp,
    detail: 'You receive reviews, feedback, analytics and actionable insights — per product and per outlet.',
  },
]

const QR_TYPES = [
  { icon: Store, title: 'Outlet QR', detail: 'Entrance standee and counter cards for the whole location.' },
  { icon: Table2, title: 'Table QR', detail: 'Table-level codes so feedback carries a seat number.' },
  { icon: Package, title: 'Product QR', detail: 'One code per dish, SKU or service.' },
  { icon: Package, title: 'Packaging QR', detail: 'Takeaway sleeves, boxes and delivery inserts.' },
  { icon: Receipt, title: 'Bill QR', detail: 'Printed on the receipt, scanned right after paying.' },
  { icon: Sparkles, title: 'Campaign QR', detail: 'Flyers, stories and seasonal menus with their own tracking.' },
]

export function Landing() {
  const scope = useMemo(() => ({ range: resolveRange('30d'), outletId: 'all' as const }), [])
  const stats = useMemo(() => overview(scope), [scope])
  const series = useMemo(() => seriesFor(scope), [scope])
  const productRows = useMemo(() => byProduct(scope).slice(0, 4), [scope])
  const mango = products[0]
  const thane = outlets[0]

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container-page relative grid gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow>AI Customer Review &amp; Feedback Platform</Eyebrow>
            <h1 className="mt-4 text-balance-tight text-[40px] font-semibold leading-[1.05] text-ink sm:text-[56px] lg:text-[60px]">
              Turn Every Customer Experience Into a Review
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
              AI-powered customer feedback and review management for businesses with one outlet or hundreds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Start Free <ArrowRight size={17} />
              </ButtonLink>
              <ButtonLink href="#how" size="lg" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
            <p className="mt-5 text-[13px] text-faint">
              No card required · Works with Google, Instagram and your own links · Live in 10 minutes
            </p>
          </motion.div>

          <HeroVisual code={demoQR.code} />
        </div>

        {/* ------------------------------------------------------- the flow */}
        <div className="container-page relative pb-4">
          <FlowVisual />
        </div>

        {/* -------------------------------------------------------- hero stats */}
        <div className="container-page relative pb-16">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
            {HERO_STATS.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 0.08} className="bg-surface px-6 py-7 text-center">
                <p className="font-display text-[34px] font-semibold tracking-tight text-ink">{stat.value}</p>
                <p className="mt-1 text-[13px] text-muted">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- how it works */}
      <section id="how" className="border-y border-line bg-surface py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="A simple process. A big impact."
            description="Four steps between a finished meal and a review that compounds — with the feedback you can actually act on captured along the way."
          />

          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-[42px] hidden h-px bg-line lg:block" />
            <div className="grid gap-8 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <Reveal key={step.number} delay={index * 0.08} className="relative">
                  <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                    <span className="relative z-10 grid size-[52px] shrink-0 place-items-center rounded-2xl border border-line bg-surface text-accent shadow-soft">
                      <step.icon size={21} />
                    </span>
                    <div className="lg:mt-5">
                      <p className="font-display text-[12px] font-semibold tracking-[0.2em] text-faint">
                        {step.number}
                      </p>
                      <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-ink">{step.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted lg:mt-4">{step.detail}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------- customer review journey */}
      <section className="py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="AI review writer"
            title="Customers rarely write reviews. They will approve one."
            description="The hard part was never the rating — it is the blank text box. ReviewDot turns what a customer already told you into a review they can edit and post in one tap."
          />

          <Reveal className="mt-12">
            <ReviewWriterDemo />
          </Reveal>

          <div className="thin-scroll mt-14 flex gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {[
              { step: 'rate' as const, rating: 0, label: '1 · Rate the product' },
              { step: 'detail' as const, rating: 5, label: '2 · Quick feedback' },
              { step: 'thanks' as const, rating: 5, label: '3 · Share publicly' },
              { step: 'improve' as const, rating: 2, label: '4 · Improvement feedback' },
            ].map((screen, index) => (
              <Reveal key={screen.label} delay={index * 0.08} className="shrink-0">
                <PhoneFrame label={screen.label}>
                  <ReviewExperience
                    qr={demoQR}
                    product={mango}
                    outlet={thane}
                    initialStep={screen.step}
                    initialRating={screen.rating}
                    compact
                  />
                </PhoneFrame>
              </Reveal>
            ))}
          </div>

          <Reveal className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-[14px] leading-relaxed text-muted">
              Try it yourself — the demo below is the same experience your customers get.
            </p>
            <ButtonLink href={`/r/${demoQR.code}`} variant="secondary" className="mt-4">
              Open the live demo <ArrowRight size={16} />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------- product-level reviews */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <Reveal>
            <Eyebrow>Product-specific reviews</Eyebrow>
            <h2 className="mt-3 text-balance-tight text-[30px] font-semibold leading-[1.12] text-ink sm:text-[38px]">
              Know exactly which product, table and outlet the feedback came from.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Every QR carries its full context. So a three-star rating is never just "the café was okay" — it is a
              specific dessert, on a specific table, at a specific outlet, on a Saturday evening.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                { icon: Building2, label: 'Business', value: business.name },
                { icon: Store, label: 'Outlet', value: 'Thane' },
                { icon: Table2, label: 'Location', value: 'Table 12' },
                { icon: Package, label: 'Product', value: 'Mango Cheesecake' },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                    <row.icon size={16} />
                  </span>
                  <span className="text-[13px] text-muted">{row.label}</span>
                  <span className="ml-auto text-[14px] font-medium text-ink">{row.value}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="overflow-hidden" padded={false}>
              <div className="border-b border-line px-5 py-4">
                <p className="text-[13px] font-semibold text-ink">Product intelligence</p>
                <p className="text-[12px] text-muted">Last 30 days · all outlets</p>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-faint">
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 text-right font-medium">Reviews</th>
                    <th className="px-3 py-3 text-right font-medium">Rating</th>
                    <th className="px-5 py-3 text-right font-medium">Positive</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2.5">
                          <span aria-hidden className="text-lg">
                            {row.emoji}
                          </span>
                          <span className="text-[14px] font-medium text-ink">{row.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-ink-soft">{row.reviews}</td>
                      <td className="px-3 py-3.5 text-right text-[14px] font-medium tabular-nums text-ink">
                        {row.rating.toFixed(1)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[14px] tabular-nums text-brand-600">
                        {Math.round(row.positive * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ QR system */}
      <section className="py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="QR system"
            title="One studio for every code you print."
            description="Generate, brand, download and track every QR code across outlets — then change what it points to without reprinting a thing."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            <div className="grid gap-4 sm:grid-cols-2">
              {QR_TYPES.map((type, index) => (
                <Reveal key={type.title} delay={index * 0.05}>
                  <Card hover className="h-full">
                    <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                      <type.icon size={18} />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">{type.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{type.detail}</p>
                  </Card>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <Card className="lg:sticky lg:top-24">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Dynamic QR</p>
                    <p className="mt-1 text-[12px] text-muted">reviewdot.in/r/{demoQR.code}</p>
                  </div>
                  <Badge tone="positive">
                    <span className="size-1.5 rounded-full bg-brand-500" /> Active
                  </Badge>
                </div>

                <div className="mt-5 flex items-center gap-5">
                  <div className="rounded-2xl border border-line p-3">
                    <QRPreview value={scanUrl(demoQR.code)} size={104} />
                  </div>
                  <div className="space-y-3 text-[13px]">
                    <p className="flex items-center gap-2 text-ink-soft">
                      <Repeat size={15} className="text-accent" /> Change the destination anytime
                    </p>
                    <p className="flex items-center gap-2 text-ink-soft">
                      <Package size={15} className="text-accent" /> Re-point to a new product
                    </p>
                    <p className="flex items-center gap-2 text-ink-soft">
                      <QrCode size={15} className="text-accent" /> Same printed code, forever
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {['Active', 'Paused', 'Archived'].map((status, index) => (
                    <div
                      key={status}
                      className={`rounded-xl border px-2 py-2 text-[12px] font-medium ${
                        index === 0 ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted'
                      }`}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- dashboard */}
      <section className="border-y border-line bg-surface py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="The dashboard"
            title="Scans, reviews, products, outlets — in one view."
            description="Real numbers from the ReviewDot demo workspace. Every card, chart and table below is live in the product."
          />

          <Reveal className="mt-12">
            <Card className="overflow-hidden" padded={false}>
              <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'QR Scans', value: formatNumber(stats.scans), trend: stats.trends.scans, icon: ScanLine },
                  { label: 'Reviews', value: formatNumber(stats.reviews), trend: stats.trends.reviews, icon: MessageSquareText },
                  { label: 'Average Rating', value: `${stats.rating.toFixed(1)} ★`, trend: stats.trends.rating, icon: Star },
                  {
                    label: 'Review Conversion',
                    value: formatPercent(stats.conversion),
                    trend: stats.trends.conversion,
                    icon: BarChart3,
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-surface p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-muted">{kpi.label}</p>
                      <kpi.icon size={15} className="text-faint" />
                    </div>
                    <p className="mt-3 font-display text-[28px] font-semibold tracking-tight text-ink">{kpi.value}</p>
                    <p className="mt-1 text-[12px] font-medium text-brand-600">
                      {formatTrend(kpi.trend)} vs previous period
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-line p-5 sm:p-6">
                <TrendChart
                  labels={series.map((point) => point.date)}
                  series={[
                    {
                      key: 'scans',
                      label: 'QR scans',
                      color: 'var(--color-chart-2)',
                      values: series.map((point) => point.scans),
                      fill: true,
                    },
                    {
                      key: 'reviews',
                      label: 'Reviews',
                      color: 'var(--color-chart-1)',
                      values: series.map((point) => point.reviews),
                      fill: true,
                    },
                  ]}
                  caption="Scans and reviews over the last 30 days"
                />
              </div>
            </Card>
          </Reveal>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'AI review intelligence',
                detail:
                  'Summaries, positive and negative keywords, and recommended actions — generated from your own reviews, never invented.',
              },
              {
                icon: Users,
                title: 'Customer memory',
                detail: 'See repeat visitors, what they ordered, and how their ratings changed over time.',
              },
              {
                icon: Store,
                title: 'Outlet benchmarking',
                detail: 'Compare scan volume, conversion and rating across every outlet, week by week.',
              },
            ].map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.07}>
                <Card hover className="h-full">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <feature.icon size={18} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{feature.detail}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- proof */}
      <section className="py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why teams switch"
            title="Not a QR generator. A feedback system."
            description="A printed code is the cheap part. Knowing that Table 12 keeps sending back the cheesecake is the part that changes your week."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  'We found out one outlet was losing every Saturday evening to wait times. Two weeks after fixing the shift roster, our rating moved from 4.3 to 4.7.',
                name: 'Ritika S.',
                role: 'Owner, 3 café outlets',
                rating: 5,
              },
              {
                quote:
                  'The product-level view is the thing. We stopped guessing which dessert to keep on the menu — the reviews told us.',
                name: 'Arjun M.',
                role: 'Operations lead, casual dining',
                rating: 5,
              },
              {
                quote:
                  'Google reviews tripled in a quarter, and the unhappy feedback comes to us first, which is exactly how it should work.',
                name: 'Sara D.',
                role: 'Brand manager, bakery chain',
                rating: 5,
              },
            ].map((item, index) => (
              <Reveal key={item.name} delay={index * 0.07}>
                <Card className="flex h-full flex-col">
                  <Stars value={item.rating} />
                  <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink-soft">"{item.quote}"</p>
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-[13px] font-medium text-ink">{item.name}</p>
                    <p className="text-[12px] text-muted">{item.role}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-faint">
            Illustrative examples from the ReviewDot demo workspace.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------- industries */}
      <section className="border-t border-line bg-surface py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Who uses it"
            title="Wherever the experience happens."
            description="One outlet or five hundred — the same code, the same flow, the same dashboard."
          />
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {[
              'Restaurants',
              'Cafés',
              'Hotels',
              'Salons',
              'Retail',
              'Gyms',
              'Clinics',
              'Bakeries',
              'QSR',
              'Cloud kitchens',
            ].map((industry) => (
              <span
                key={industry}
                className="rounded-full border border-line bg-canvas px-4 py-2 text-[13px] font-medium text-ink-soft"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="pb-24">
        <div className="container-page">
          <div className="grid-backdrop relative overflow-hidden rounded-[32px] border border-line bg-surface px-6 py-16 text-center shadow-card sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/40" />
            <div className="relative">
              <Eyebrow>Collect. Understand. Improve. Grow.</Eyebrow>
              <h2 className="mx-auto mt-4 max-w-2xl text-balance-tight text-[32px] font-semibold leading-[1.1] text-ink sm:text-[44px]">
                Turn your next table into your next review.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
                Set up your first outlet, print a table card, and watch the first scans land in your dashboard today.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/signup" size="lg">
                  Start Free <ArrowRight size={17} />
                </ButtonLink>
                <ButtonLink href="/app" size="lg" variant="secondary">
                  Explore the dashboard
                </ButtonLink>
              </div>
              <p className="mt-6 text-[13px] text-faint">
                {formatCompact(10000)}+ businesses · {formatCompact(1000000)}+ reviews collected
              </p>
              <p className="mt-2 text-[12px] text-faint">
                Looking for the full feature list?{' '}
                <Link href="/product" className="font-medium text-accent hover:underline">
                  See the product tour
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
