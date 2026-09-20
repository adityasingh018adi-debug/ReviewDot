import { ArrowRight, BookOpen, FileText, LifeBuoy, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, SectionHeading } from '@/components/marketing/Section'
import { demoQR } from '@/lib/data'

const GUIDES = [
  {
    icon: BookOpen,
    title: 'QR placement playbook',
    detail: 'Where codes actually get scanned: table tents beat menus, bill footers beat entrances.',
    minutes: '6 min read',
  },
  {
    icon: FileText,
    title: 'Writing the ask',
    detail: 'The exact wording that lifts scan-to-review conversion without pressuring customers.',
    minutes: '4 min read',
  },
  {
    icon: PlayCircle,
    title: 'First 100 reviews',
    detail: 'A two-week rollout plan for a single outlet, with staff prompts and a printing checklist.',
    minutes: '8 min read',
  },
  {
    icon: LifeBuoy,
    title: 'Responding to 1★ feedback',
    detail: 'A response framework that turns a complaint into a returning customer.',
    minutes: '5 min read',
  },
]

export function Resources() {
  return (
    <>
      <section className="border-b border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Resources"
            title="Everything we learned from a million scans."
            description="Practical guides for getting codes printed, scanned and acted on."
          />
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-4 md:grid-cols-2">
          {GUIDES.map((guide, index) => (
            <Reveal key={guide.title} delay={index * 0.05}>
              <Card hover className="flex h-full gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <guide.icon size={18} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">{guide.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{guide.detail}</p>
                  <p className="mt-3 text-[12px] text-faint">{guide.minutes}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-surface py-16">
        <div className="container-page grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-balance-tight text-[28px] font-semibold leading-[1.15] text-ink">
              See the customer experience for yourself.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Open the live demo code, rate a product, and watch the response appear in the dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to={`/r/${demoQR.code}`}>
                Open demo experience <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink to="/app" variant="secondary">
                Open dashboard
              </ButtonLink>
            </div>
          </div>
          <Card>
            <h3 className="text-[15px] font-semibold tracking-tight text-ink">Help centre</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                'Connecting your Google Business Profile',
                'Printing and laminating table cards',
                'Inviting outlet managers',
                'Exporting reviews for reporting',
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="/resources"
                    className="flex items-center justify-between gap-3 text-[13px] text-muted transition-colors hover:text-ink"
                  >
                    {item} <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </>
  )
}
