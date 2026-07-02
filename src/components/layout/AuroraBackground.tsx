/**
 * Calm ambient backdrop: two static soft gradients and a faint grid.
 * No animation loops — everything here is paint-once and compositor-free.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid-lines absolute inset-0 opacity-50" />
      <div
        className="absolute -top-48 -left-40 h-[40rem] w-[40rem] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgb(97 114 243 / 0.14), transparent 65%)' }}
      />
      <div
        className="absolute top-1/2 -right-56 h-[36rem] w-[36rem] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgb(168 85 247 / 0.10), transparent 65%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/85" />
    </div>
  )
}
