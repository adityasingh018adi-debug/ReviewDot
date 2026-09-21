import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Hash routing keeps the scroll position between pages; this resets it. */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}
