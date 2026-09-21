import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:brightness-110 shadow-soft',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-raised',
  ghost: 'text-ink-soft hover:text-ink hover:bg-raised',
  subtle: 'bg-raised text-ink border border-transparent hover:border-line',
  danger: 'bg-danger text-white hover:brightness-110',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl gap-1.5',
  md: 'h-11 px-5 text-sm rounded-2xl gap-2',
  lg: 'h-13 px-6 text-[15px] rounded-2xl gap-2',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200 whitespace-nowrap',
    'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
    VARIANTS[variant],
    SIZES[size],
    className,
  )

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

type ButtonLinkProps = {
  to: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
  external?: boolean
  onClick?: () => void
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  external,
  onClick,
}: ButtonLinkProps) {
  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonClass(variant, size, className)}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={buttonClass(variant, size, className)} onClick={onClick}>
      {children}
    </Link>
  )
}
