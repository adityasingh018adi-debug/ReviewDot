import type { ReactNode } from 'react'

/**
 * The top of every dashboard page.
 *
 * Matches the Overview's header so the pages read as one product: display face
 * for the title, the scope control beside it rather than buried in the chrome,
 * and the page's primary action last.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  )
}
