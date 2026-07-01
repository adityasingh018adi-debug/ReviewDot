import { forwardRef, useRef, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'ghost' | 'glass' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-pulse-500 to-aura-500 text-pure shadow-glow-sm hover:shadow-glow hover:brightness-110',
  ghost: 'text-mist-300 hover:text-mist-50 hover:bg-white/6',
  glass: 'glass text-mist-100 hover:bg-white/10 hover:border-white/20',
  danger: 'bg-rose-glow/15 text-rose-glow border border-rose-glow/30 hover:bg-rose-glow/25',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
  icon: 'h-9 w-9 shrink-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'glass', size = 'md', onClick, children, ...props },
  ref,
) {
  const innerRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const el = innerRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      const ripple = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      ripple.className = 'ripple-ink'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`
      el.appendChild(ripple)
      setTimeout(() => ripple.remove(), 650)
    }
    onClick?.(e)
  }

  return (
    <button
      ref={(node) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      onClick={handleClick}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-xl font-medium',
        'transition-all duration-200 active:scale-[0.97] cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse-400',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
