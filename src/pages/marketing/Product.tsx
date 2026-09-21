import {
  BarChart3,
  Bell,
  Building2,
  Download,
  Layers,
  MessageSquareWarning,
  Package,
  QrCode,
  Repeat,
  ScanLine,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Reveal, SectionHeading } from '@/components/marketing/Section'
import { PhoneFrame } from '@/components/marketing/PhoneFrame'
import { ReviewExperience } from '@/components/review/ReviewExperience'
import { TableCard } from '@/components/qr/TableCard'
import { demoQR, outlets, products } from '@/lib/data'

const CAPABILITIES = [
  {
    id: 'qr',
    icon: QrCode,
    title: 'QR studio',
    detail:
      'Outlet, table, product, packaging, bill and campaign codes. Generate in bulk, download as PNG or SVG, print a ready-made table card, or copy the short link.',
  },
  {
    id: 'dynamic',
    icon: Repeat,
    title: 'Dynamic destinations',
    detail:
      'Every code is a reviewdot.in/r/ link you control. Re-point it to a new product, pause it during a refurbishment, or archive it — the printed code never changes.',
  },
  {
    id: 'experience',
    icon: ScanLine,
    title: 'Ten-second customer flow',
    detail:
      'Rate, tap a few feedback chips, and optionally continue to Google or Instagram. No app, no account, no dark patterns.',
  },
  {
    id: 'intelligence',
    icon: Sparkles,
    title: 'Review intelligence',
    detail:
      'Product summaries, positive and negative keywords, recurring themes and recommended actions — computed from your own reviews.',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics that match operations',
    detail:
      'Scans, reviews, conversion, public review clicks and feedback volume, sliced by outlet, product, campaign and date range.',
  },
  {
    id: 'routing',
    icon: MessageSquareWarning,
    title: 'Feedback routing',
    detail:
      'Ratings of 3★ and below become private feedback with a status pipeline, so the outlet manager fixes it before it becomes a public review.',
  },
  {
    id: 'customers',
    icon: Users,
    title: 'Customer memory',
    detail: 'Recognise repeat visitors, what they ordered and how their ratings moved over time.',
  },
  {
    id: 'multi',
    icon: Building2,
    title: 'Multi-outlet by default',
    detail: 'Benchmark outlets against each other on volume, rating and conversion — not just a single average.',
  },
  {
    id: 'exports',
    icon: Download,
    title: 'Exports and printing',
    detail: 'CSV exports on every table, and print-ready QR sheets that already carry your business name.',
  },
]

export function Product() {
  return (
    <>
      <section className="border-b border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Product"
            title="Everything between a printed code and a better rating."
            description="ReviewDot is a feedback system, not a QR generator. Here is what is in the box."
          />
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink to="/signup">Start Free</ButtonLink>
            <ButtonLink to={`/r/${demoQR.code}`} variant="secondary">
              Try the customer flow
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability, index) => (
            <Reveal key={capability.id} delay={index * 0.04}>
              <Card hover className="h-full" >
                <span id={capability.id} className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <capability.icon size={18} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">{capability.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{capability.detail}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <Badge tone="positive">
              <Layers size={12} /> Context on every rating
            </Badge>
            <h2 className="mt-4 text-balance-tight text-[30px] font-semibold leading-[1.12] text-ink sm:text-[36px]">
              Business → Outlet → Table → Product.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              A rating with no context is trivia. ReviewDot stamps every response with the outlet, the exact location
              and the product it was about, so the dashboard can tell you what to fix and where.
            </p>
            <ul className="mt-6 space-y-3 text-[14px] text-ink-soft">
              {[
                'Table 12 at Thane is reporting long waits on Saturdays',
                'Mango Cheesecake is 4.9★ at Thane but 4.5★ at Bandra',
                'Packaging QRs convert better than bill QRs for takeaway',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Star size={15} className="mt-0.5 shrink-0 text-accent" /> {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="flex justify-center gap-6">
            <PhoneFrame label="Customer view">
              <ReviewExperience
                qr={demoQR}
                product={products[0]}
                outlet={outlets[0]}
                initialStep="detail"
                initialRating={5}
                compact
              />
            </PhoneFrame>
            <div className="hidden self-center sm:block">
              <TableCard code={demoQR.code} size="sm" className="w-[210px]" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Trust"
            title="Transparent by design."
            description="Customers are never tricked into a public review, and businesses never pay for reviews they did not earn."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'No review gating tricks',
                detail:
                  'Everyone can reach a public platform. Unhappy customers simply also get a direct line to the team first.',
              },
              {
                icon: Bell,
                title: 'Honest routing',
                detail: 'The customer always sees where their feedback goes, before they submit it.',
              },
              {
                icon: Package,
                title: 'Your data stays yours',
                detail: 'Export anything as CSV. Nothing is posted on a customer’s behalf, ever.',
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <Card className="h-full">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <item.icon size={18} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.detail}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
