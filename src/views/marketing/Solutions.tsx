'use client'

import { Building2, Coffee, Dumbbell, HeartPulse, ShoppingBag, Utensils } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, SectionHeading } from '@/components/marketing/Section'

const SEGMENTS = [
  {
    icon: Utensils,
    title: 'Restaurants & cafés',
    placement: 'Table tents, menus, bill footers',
    outcome: 'Dish-level ratings that tell you what to keep on the menu.',
  },
  {
    icon: ShoppingBag,
    title: 'Retail & FMCG',
    placement: 'Packaging inserts, shelf talkers, receipts',
    outcome: 'Product feedback from customers who are holding the product.',
  },
  {
    icon: HeartPulse,
    title: 'Clinics & wellness',
    placement: 'Reception standee, discharge slip',
    outcome: 'Service feedback routed privately before it becomes a public review.',
  },
  {
    icon: Coffee,
    title: 'Cloud kitchens',
    placement: 'Delivery bag sticker, packaging sleeve',
    outcome: 'Ratings tied to the dish and the outlet that cooked it.',
  },
  {
    icon: Dumbbell,
    title: 'Gyms & salons',
    placement: 'Counter card, appointment card',
    outcome: 'Staff and service-level insight, per location.',
  },
  {
    icon: Building2,
    title: 'Multi-outlet chains',
    placement: 'Every outlet, centrally managed',
    outcome: 'Benchmark outlets on conversion and rating, not gut feel.',
  },
]

export function Solutions() {
  return (
    <>
      <section className="border-b border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Solutions"
            title="Wherever the experience happens, that's where the code goes."
            description="The strongest feedback arrives within minutes of the experience. ReviewDot puts the ask exactly there."
          />
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SEGMENTS.map((segment, index) => (
            <Reveal key={segment.title} delay={index * 0.05}>
              <Card hover className="flex h-full flex-col">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <segment.icon size={18} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-ink">{segment.title}</h3>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">Where it goes</p>
                <p className="mt-1 text-[13px] text-muted">{segment.placement}</p>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">What you get</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{segment.outcome}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-surface py-16">
        <div className="container-page text-center">
          <SectionHeading
            title="Not sure where to start?"
            description="Most teams begin with table and bill QRs at one outlet, then add product codes once the first hundred reviews land."
          />
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/signup">Start Free</ButtonLink>
            <ButtonLink href="/pricing" variant="secondary">
              See pricing
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
