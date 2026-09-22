import { BarChart3, MessageSquareText, ScanLine, Sparkles, Star } from 'lucide-react'

/**
 * The product in one picture: what the customer does, what ReviewDot does, and
 * what the business gets. Rendered on the server — no animation, no JavaScript,
 * so it is crawlable and paints immediately.
 */

const STEPS = [
  { icon: ScanLine, label: 'QR scan', caption: 'Table, counter, receipt or packaging' },
  { icon: Star, label: 'Customer feedback', caption: 'A rating and what stood out' },
  { icon: Sparkles, label: 'AI review', caption: 'Their words, polished — they edit it' },
  { icon: MessageSquareText, label: 'Public review', caption: 'Posted where they choose' },
  { icon: BarChart3, label: 'Business insights', caption: 'Per outlet, per product' },
]

export function FlowVisual() {
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {STEPS.map((step, index) => (
        <li
          key={step.label}
          className="relative rounded-2xl border border-line bg-surface p-4 shadow-soft"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
            <step.icon size={17} strokeWidth={1.9} />
          </span>
          <p className="mt-3 text-[13px] font-semibold tracking-tight text-ink">{step.label}</p>
          <p className="mt-1 text-[12px] leading-snug text-muted">{step.caption}</p>
          {index < STEPS.length - 1 ? (
            <span
              aria-hidden
              className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-canvas text-[10px] text-faint sm:flex"
            >
              ›
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
