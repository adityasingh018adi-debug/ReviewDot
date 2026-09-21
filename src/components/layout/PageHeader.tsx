import type { ReactNode } from 'react'

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1.5 text-[14px] text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  )
}
