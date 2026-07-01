import { useEffect, useRef, useState } from 'react'

/** Animated count-up that eases toward `target` whenever it changes. */
export function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      const value = from + (target - from) * eased
      setDisplay(Number(value.toFixed(decimals)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, decimals])

  return display
}

/** Global keyboard shortcut. `combo` example: "mod+k", "escape", "g d". */
export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    const parts = combo.toLowerCase().split('+')
    const needMod = parts.includes('mod')
    const needShift = parts.includes('shift')
    const key = parts[parts.length - 1]

    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (needMod !== mod) return
      if (needShift !== e.shiftKey) return
      if (e.key.toLowerCase() !== key) return
      handlerRef.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo, enabled])
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Re-renders on an interval — used for live timestamps and simulated realtime data. */
export function useInterval(callback: () => void, delayMs: number | null) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  })
  useEffect(() => {
    if (delayMs === null) return
    const id = setInterval(() => saved.current(), delayMs)
    return () => clearInterval(id)
  }, [delayMs])
}
