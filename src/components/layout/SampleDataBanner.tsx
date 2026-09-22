'use client'

import { Info } from 'lucide-react'

/**
 * Shown on every dashboard page while a signed-in account is still looking at
 * the seeded dataset rather than its own rows.
 *
 * This exists because the alternative is worse in a specific way: a real
 * customer seeing 1,248 scans and a 4.7 average would reasonably believe those
 * were theirs. Until each page reads the database, saying so plainly is the
 * only honest option. It disappears page by page as the queries land.
 */
export function SampleDataBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-2 border-b border-line bg-accent-soft px-4 py-2.5 text-[12px] leading-relaxed text-ink-soft sm:px-6"
    >
      <Info size={14} className="mt-0.5 shrink-0 text-accent" />
      <span>
        <span className="font-medium text-ink">These figures are sample data.</span> Your workspace
        is set up and collecting real feedback from your QR codes — the dashboard starts showing it
        as each report is connected.
      </span>
    </div>
  )
}
