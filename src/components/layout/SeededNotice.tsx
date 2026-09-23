import { Info } from 'lucide-react'
import { appMode } from '@/lib/app-mode'

/**
 * Marks a page that is still rendering the seeded dataset.
 *
 * This used to sit in the layout and cover the whole dashboard. Now that some
 * pages read the database and some do not, a blanket banner would be wrong on
 * the real ones — so each seeded page carries its own, and deletes the line
 * when its queries land. When none are left, so is this component.
 *
 * It renders nothing in demo mode: there, sample data is the entire point and
 * saying so on every page is noise.
 */
export function SeededNotice() {
  if (appMode() !== 'live') return null

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-2xl border border-line bg-accent-soft px-4 py-3 text-[12px] leading-relaxed text-ink-soft"
    >
      <Info size={14} className="mt-0.5 shrink-0 text-accent" />
      <span>
        <span className="font-medium text-ink">This page is still showing sample data.</span> Your real
        feedback is being collected and already appears on the dashboard and the feedback page.
      </span>
    </div>
  )
}
