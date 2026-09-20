import { Outlet } from 'react-router-dom'
import { SiteNav } from './SiteNav'
import { SiteFooter } from './SiteFooter'

export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
