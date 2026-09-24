import type { Metadata } from 'next'
import { Billing } from '@/views/app/Billing'
import { dashboardContext } from '@/services/dashboard-context.server'

export const metadata: Metadata = { title: 'Billing' }

export default async function Page() {
  const context = await dashboardContext()

  const [organization, counts] = await Promise.all([
    context.repo.organization(),
    context.repo.counts(),
  ])

  return <Billing organization={organization} counts={counts} />
}
