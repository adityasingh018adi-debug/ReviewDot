'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Theme preference.
 *
 * The value lives on <html data-theme>, applied before paint by ThemeScript, so
 * there is no flash. This hook subscribes to that attribute rather than holding
 * its own copy, which keeps server and client renders in agreement.
 */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'reviewdot-theme'
const EVENT = 'reviewdot:theme'

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

function readTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) ?? 'light'
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light' as Theme)

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private browsing: the theme simply does not persist
    }
    window.dispatchEvent(new Event(EVENT))
  }, [])

  const toggle = useCallback(() => setTheme(readTheme() === 'dark' ? 'light' : 'dark'), [setTheme])

  return { theme, setTheme, toggle }
}
