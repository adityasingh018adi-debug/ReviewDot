import { useEffect, useRef } from 'react'

/**
 * Ambient scene behind the interface: drifting aurora blobs, a slow grid,
 * floating abstract 3D shapes, and gentle pointer parallax. Pure CSS
 * transforms — everything runs on the compositor.
 */
export function AuroraBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24
        const y = (e.clientY / window.innerHeight - 0.5) * 24
        parallaxRef.current?.style.setProperty('transform', `translate3d(${x}px, ${y}px, 0)`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid-lines absolute inset-0 opacity-60 [animation:grid-pan_18s_linear_infinite]" />

      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        <div
          className="animate-aurora absolute -top-40 -left-40 h-[42rem] w-[42rem] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgb(97 114 243 / 0.22), transparent 65%)' }}
        />
        <div
          className="animate-aurora absolute top-1/3 -right-52 h-[38rem] w-[38rem] rounded-full blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgb(168 85 247 / 0.16), transparent 65%)',
            animationDelay: '-9s',
          }}
        />
        <div
          className="animate-aurora absolute -bottom-60 left-1/4 h-[36rem] w-[36rem] rounded-full blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgb(76 224 224 / 0.10), transparent 65%)',
            animationDelay: '-17s',
          }}
        />

        {/* floating abstract shapes */}
        <div
          className="animate-float-slow absolute top-[18%] right-[14%] hidden lg:block"
          style={{ animationDelay: '-2s' }}
        >
          <div
            className="h-24 w-24 rounded-3xl border border-white/8 opacity-70"
            style={{
              background: 'linear-gradient(135deg, rgb(97 114 243 / 0.14), rgb(168 85 247 / 0.05))',
              transform: 'rotate3d(1, 1, 0, 32deg)',
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.12), 0 30px 60px -20px rgb(0 0 0 / 0.6)',
            }}
          />
        </div>
        <div
          className="animate-float-slow absolute bottom-[22%] left-[8%] hidden lg:block"
          style={{ animationDelay: '-5s' }}
        >
          <div
            className="h-16 w-16 rounded-full border border-white/8 opacity-60"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgb(76 224 224 / 0.22), rgb(97 114 243 / 0.05))',
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.15), 0 24px 48px -16px rgb(0 0 0 / 0.55)',
            }}
          />
        </div>
        <div className="animate-spin-slow absolute top-[58%] right-[6%] hidden xl:block opacity-50">
          <div
            className="h-20 w-20 border border-pulse-400/25"
            style={{ transform: 'rotate3d(1, 0.6, 0.2, 55deg)', borderRadius: '30%' }}
          />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/85" />
    </div>
  )
}
