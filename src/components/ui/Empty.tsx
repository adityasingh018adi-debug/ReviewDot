import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function Empty({
  title,
  detail,
  action,
}: {
  title: string
  detail?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-2xl bg-raised text-muted">
        <Inbox size={20} />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {detail ? <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">{detail}</p> : null}
      </div>
      {action}
    </div>
  )
}
