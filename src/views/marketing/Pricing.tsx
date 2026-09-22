'use client'

import { useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal, SectionHeading } from '@/components/marketing/Section'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Starter',
    monthly: 0,
    yearly: 0,
    tagline: 'One outlet, everything you need to collect your first reviews.',
    features: ['1 outlet', '10 QR codes', 'Unlimited reviews', 'Product-level ratings', 'CSV export'],
    cta: 'Start Free',
  },
  {
    name: 'Growth',
    monthly: 1499,
    yearly: 14990,
    tagline: 'For multi-outlet businesses that run on their numbers.',
    features: [
      'Up to 5 outlets',
      'Unlimited QR codes',
      'Campaign tracking',
      'AI review intelligence',
      'Feedback routing & statuses',
      'Team roles',
    ],
    cta: 'Start 14-day trial',
    featured: true,
  },
  {
    name: 'Scale',
    monthly: 3999,
    yearly: 39990,
    tagline: 'Chains and franchises with brand-level reporting.',
    features: [
      'Unlimited outlets',
      'Multi-brand workspaces',
      'Outlet benchmarking',
      'API & webhooks',
      'Priority support',
      'Onboarding assistance',
    ],
    cta: 'Talk to sales',
  },
]

const MATRIX = [
  { label: 'Outlets', values: ['1', 'Up to 5', 'Unlimited'] },
  { label: 'QR codes', values: ['10', 'Unlimited', 'Unlimited'] },
  { label: 'Dynamic destinations', values: [true, true, true] },
  { label: 'Product-level analytics', values: [true, true, true] },
  { label: 'AI insights', values: [false, true, true] },
  { label: 'Campaigns', values: [false, true, true] },
  { label: 'Outlet benchmarking', values: [false, false, true] },
  { label: 'API & webhooks', values: [false, false, true] },
]

const FAQS = [
  {
    q: 'Do I need to reprint QR codes if something changes?',
    a: 'No. Every code is a dynamic link. Change the product, the destination or the status, and the printed code keeps working.',
  },
  {
    q: 'Does ReviewDot hide bad reviews?',
    a: 'No. Every customer can reach a public review platform. Unhappy customers are simply also offered a direct line to your team first, and that is shown to them clearly.',
  },
  {
    q: 'Do customers need an app?',
    a: 'No. The scan opens a web page that works on any phone camera, with no download and no account.',
  },
  {
    q: 'Can I try it without paying?',
    a: 'Yes. The Starter plan is free forever for a single outlet, and Growth has a 14-day trial with no card required.',
  },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <>
      <section className="border-b border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Pricing"
            title="Priced per outlet, not per review."
            description="Collect as much feedback as you can — you are never penalised for growing."
          />
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn('text-[13px]', yearly ? 'text-muted' : 'font-medium text-ink')}>Monthly</span>
            <button
              role="switch"
              aria-checked={yearly}
              aria-label="Toggle yearly billing"
              onClick={() => setYearly((value) => !value)}
              className={cn('relative h-6 w-11 rounded-full transition-colors', yearly ? 'bg-accent' : 'bg-line-strong')}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform',
                  yearly ? 'translate-x-5.5' : 'translate-x-0.5',
                )}
              />
            </button>
            <span className={cn('text-[13px]', yearly ? 'font-medium text-ink' : 'text-muted')}>
              Yearly <span className="text-accent">· 2 months free</span>
            </span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.06}>
              <Card
                className={cn(
                  'flex h-full flex-col',
                  plan.featured && 'border-accent shadow-card ring-1 ring-accent/20',
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold tracking-tight text-ink">{plan.name}</h3>
                  {plan.featured ? <Badge tone="brand">Most popular</Badge> : null}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{plan.tagline}</p>
                <p className="mt-6 font-display text-[36px] font-semibold leading-none tracking-tight text-ink">
                  {plan.monthly === 0 ? 'Free' : `₹${(yearly ? plan.yearly / 12 : plan.monthly).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  {plan.monthly === 0 ? null : (
                    <span className="ml-1 text-[13px] font-normal text-muted">/outlet /month</span>
                  )}
                </p>
                {yearly && plan.monthly > 0 ? (
                  <p className="mt-1 text-[12px] text-faint">₹{plan.yearly.toLocaleString('en-IN')} billed yearly</p>
                ) : null}

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                      <Check size={15} className="mt-0.5 shrink-0 text-accent" /> {feature}
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href="/signup"
                  variant={plan.featured ? 'primary' : 'secondary'}
                  className="mt-7 w-full"
                >
                  {plan.cta}
                </ButtonLink>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading title="Compare plans" align="center" />
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-line text-[12px] text-faint">
                  <th className="py-3 font-medium">Feature</th>
                  {PLANS.map((plan) => (
                    <th key={plan.name} className="py-3 text-center font-medium text-ink">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <td className="py-3.5 text-[13px] text-ink-soft">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td key={index} className="py-3.5 text-center text-[13px] text-muted">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check size={16} className="mx-auto text-accent" />
                          ) : (
                            <Minus size={16} className="mx-auto text-faint" />
                          )
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page max-w-3xl">
          <SectionHeading title="Questions teams ask us" align="center" />
          <div className="mt-10 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-line bg-surface p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer list-none text-[15px] font-medium text-ink">
                  {faq.q}
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
